import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const units = await prisma.unit.findMany({
    where: { courseId },
    include: {
      lessons: { orderBy: { sequence: "asc" } },
    },
    orderBy: { sequence: "asc" },
  });
  return NextResponse.json(units);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Get the next sequence number
  const maxSeq = await prisma.unit.aggregate({
    where: { courseId },
    _max: { sequence: true },
  });
  const nextSequence = (maxSeq._max.sequence ?? 0) + 1;

  const unit = await prisma.unit.create({
    data: { name, sequence: nextSequence, courseId },
    include: { lessons: true },
  });

  return NextResponse.json(unit, { status: 201 });
}
