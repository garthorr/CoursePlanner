import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { lessonId, targetUnitId, newIndex } = body;

  if (!lessonId || !targetUnitId || newIndex === undefined) {
    return NextResponse.json(
      { error: "lessonId, targetUnitId, and newIndex are required" },
      { status: 400 }
    );
  }

  await prisma.$transaction(async (tx) => {
    const lesson = await tx.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new Error("Lesson not found");

    const sourceUnitId = lesson.unitId;
    const movingBetweenUnits = sourceUnitId !== targetUnitId;

    // Move the lesson to the target unit
    await tx.lesson.update({
      where: { id: lessonId },
      data: { unitId: targetUnitId, sequence: -1 }, // Temp sequence to avoid conflicts
    });

    // Get all lessons in the target unit (excluding the moved one temporarily)
    const targetLessons = await tx.lesson.findMany({
      where: { unitId: targetUnitId, id: { not: lessonId } },
      orderBy: { sequence: "asc" },
    });

    // Insert at the desired index
    targetLessons.splice(newIndex, 0, { id: lessonId } as typeof targetLessons[0]);

    // Resequence target unit
    for (let i = 0; i < targetLessons.length; i++) {
      await tx.lesson.update({
        where: { id: targetLessons[i].id },
        data: { sequence: i + 1 },
      });
    }

    // If moved between units, resequence the source unit
    if (movingBetweenUnits) {
      const sourceLessons = await tx.lesson.findMany({
        where: { unitId: sourceUnitId },
        orderBy: { sequence: "asc" },
      });
      for (let i = 0; i < sourceLessons.length; i++) {
        await tx.lesson.update({
          where: { id: sourceLessons[i].id },
          data: { sequence: i + 1 },
        });
      }
    }
  });

  return NextResponse.json({ success: true });
}
