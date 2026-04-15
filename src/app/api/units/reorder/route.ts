import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { unitId, newIndex } = body;

    if (
      typeof unitId !== "string" ||
      typeof newIndex !== "number" ||
      !Number.isInteger(newIndex) ||
      newIndex < 0
    ) {
      return NextResponse.json(
        { error: "unitId and a non-negative integer newIndex are required" },
        { status: 400 }
      );
    }

    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Park the moving unit at a temporary out-of-range sequence to avoid
      // collisions while resequencing.
      await tx.unit.update({
        where: { id: unitId },
        data: { sequence: -1 },
      });

      const siblings = await tx.unit.findMany({
        where: { courseId: unit.courseId, id: { not: unitId } },
        orderBy: { sequence: "asc" },
        select: { id: true },
      });

      const clampedIndex = Math.min(newIndex, siblings.length);
      siblings.splice(clampedIndex, 0, { id: unitId });

      for (let i = 0; i < siblings.length; i++) {
        await tx.unit.update({
          where: { id: siblings[i].id },
          data: { sequence: i + 1 },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/units/reorder error:", error);
    return NextResponse.json({ error: "Failed to reorder unit" }, { status: 500 });
  }
}
