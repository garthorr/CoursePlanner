import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const units = await prisma.unit.findMany({
      where: { courseId },
      include: {
        lessons: { orderBy: { sequence: "asc" } },
      },
      orderBy: { sequence: "asc" },
    });
    return NextResponse.json(units);
  } catch (error) {
    console.error("GET /api/courses/[courseId]/units error:", error);
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

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
  } catch (error) {
    console.error("POST /api/courses/[courseId]/units error:", error);
    return NextResponse.json({ error: "Failed to create unit" }, { status: 500 });
  }
}
