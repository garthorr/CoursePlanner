import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  const { unitId } = await params;
  const body = await request.json();
  const { name, bufferDays } = body;

  const unit = await prisma.unit.update({
    where: { id: unitId },
    data: {
      ...(name !== undefined && { name }),
      ...(bufferDays !== undefined && { bufferDays }),
    },
  });

  return NextResponse.json(unit);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  const { unitId } = await params;

  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit) {
    return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.unit.delete({ where: { id: unitId } });

    // Resequence remaining units
    const remaining = await tx.unit.findMany({
      where: { courseId: unit.courseId },
      orderBy: { sequence: "asc" },
    });
    for (let i = 0; i < remaining.length; i++) {
      await tx.unit.update({
        where: { id: remaining[i].id },
        data: { sequence: i + 1 },
      });
    }
  });

  return NextResponse.json({ success: true });
}
