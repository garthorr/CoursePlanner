import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, targetUnitId, newIndex } = body;

    if (
      typeof lessonId !== "string" ||
      typeof targetUnitId !== "string" ||
      typeof newIndex !== "number" ||
      !Number.isInteger(newIndex) ||
      newIndex < 0
    ) {
      return NextResponse.json(
        { error: "lessonId, targetUnitId, and a non-negative integer newIndex are required" },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const targetUnit = await prisma.unit.findUnique({ where: { id: targetUnitId } });
    if (!targetUnit) {
      return NextResponse.json({ error: "Target unit not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      const sourceUnitId = lesson.unitId;
      const movingBetweenUnits = sourceUnitId !== targetUnitId;

      // Move the lesson to the target unit with a temporary out-of-range sequence
      // to avoid unique-ish conflicts during resequencing.
      await tx.lesson.update({
        where: { id: lessonId },
        data: { unitId: targetUnitId, sequence: -1 },
      });

      // Get all lessons in the target unit (excluding the moved one)
      const targetLessons = await tx.lesson.findMany({
        where: { unitId: targetUnitId, id: { not: lessonId } },
        orderBy: { sequence: "asc" },
        select: { id: true },
      });

      // Clamp newIndex to a valid insertion position
      const clampedIndex = Math.min(newIndex, targetLessons.length);

      // Insert at the desired index
      targetLessons.splice(clampedIndex, 0, { id: lessonId });

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
          select: { id: true },
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
  } catch (error) {
    console.error("PATCH /api/lessons/reorder error:", error);
    return NextResponse.json({ error: "Failed to reorder lesson" }, { status: 500 });
  }
}
