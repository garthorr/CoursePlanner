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
  const body = await request.json();
  const { courseId, rows } = body as { courseId: string; rows: ImportRow[] };

  if (!courseId || !rows || !Array.isArray(rows)) {
    return NextResponse.json({ error: "courseId and rows are required" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    // Get existing units for this course
    const existingUnits = await tx.unit.findMany({
      where: { courseId },
      orderBy: { sequence: "asc" },
    });

    const unitMap = new Map(existingUnits.map((u) => [u.name.toLowerCase(), u]));
    let maxUnitSeq = existingUnits.length;

    // Get max lesson sequences per unit
    const lessonCounts = new Map<string, number>();
    for (const unit of existingUnits) {
      const maxLesson = await tx.lesson.aggregate({
        where: { unitId: unit.id },
        _max: { sequence: true },
      });
      lessonCounts.set(unit.id, maxLesson._max.sequence ?? 0);
    }

    let created = 0;
    let unitsCreated = 0;

    for (const row of rows) {
      if (!row.title?.trim()) continue;

      // Resolve or create unit
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

      // Create lesson
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

      // Add textbook correlation if provided
      if (row.textbook?.trim()) {
        await tx.textbookCorrelation.create({
          data: {
            textbook: row.textbook.trim(),
            reference: row.textbookRef?.trim() || "",
            lessonId: lesson.id,
          },
        });
      }

      // Add link if provided
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
}
