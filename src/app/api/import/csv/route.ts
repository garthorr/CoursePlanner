import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ImportRow {
  title: string;
  unit: string;
  description?: string;
  duration?: number;
  textbook?: string;
  textbookRef?: string;
  link?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, rows } = body as { courseId: string; rows: ImportRow[] };

    if (!courseId || !rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: "courseId and rows are required" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingUnits = await tx.unit.findMany({
        where: { courseId },
        orderBy: { sequence: "asc" },
      });

      const unitMap = new Map(existingUnits.map((u) => [u.name.toLowerCase(), u]));
      let maxUnitSeq = existingUnits.length;

      // Single grouped query for max lesson sequence per unit
      const lessonCounts = new Map<string, number>();
      if (existingUnits.length > 0) {
        const grouped = await tx.lesson.groupBy({
          by: ["unitId"],
          where: { unitId: { in: existingUnits.map((u) => u.id) } },
          _max: { sequence: true },
        });
        for (const g of grouped) {
          lessonCounts.set(g.unitId, g._max.sequence ?? 0);
        }
      }

      let created = 0;
      let unitsCreated = 0;

      for (const row of rows) {
        if (!row.title?.trim()) continue;

        const unitName = row.unit?.trim() || "Unassigned";
        let unit = unitMap.get(unitName.toLowerCase());

        if (!unit) {
          maxUnitSeq++;
          unit = await tx.unit.create({
            data: { name: unitName, sequence: maxUnitSeq, courseId },
          });
          unitMap.set(unitName.toLowerCase(), unit);
          lessonCounts.set(unit.id, 0);
          unitsCreated++;
        }

        const currentSeq = (lessonCounts.get(unit.id) ?? 0) + 1;
        lessonCounts.set(unit.id, currentSeq);

        const lesson = await tx.lesson.create({
          data: {
            title: row.title.trim(),
            description: row.description?.trim() || null,
            duration: row.duration || 1,
            sequence: currentSeq,
            unitId: unit.id,
          },
        });

        if (row.textbook?.trim()) {
          await tx.textbookCorrelation.create({
            data: {
              textbook: row.textbook.trim(),
              reference: row.textbookRef?.trim() || "",
              lessonId: lesson.id,
            },
          });
        }

        if (row.link?.trim()) {
          await tx.lessonLink.create({
            data: {
              url: row.link.trim(),
              lessonId: lesson.id,
            },
          });
        }

        created++;
      }

      return { lessonsCreated: created, unitsCreated };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/import/csv error:", error);
    return NextResponse.json({ error: "Failed to import CSV" }, { status: 500 });
  }
}
