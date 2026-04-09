import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  let pacing = await prisma.pacing.findUnique({
    where: { courseId },
    include: { schoolDates: { orderBy: { date: "asc" } } },
  });

  if (!pacing) {
    pacing = await prisma.pacing.create({
      data: { courseId },
      include: { schoolDates: { orderBy: { date: "asc" } } },
    });
  }

  // Calculate analytics
  const units = await prisma.unit.findMany({
    where: { courseId },
    include: { lessons: { select: { duration: true } } },
    orderBy: { sequence: "asc" },
  });

  const instructionalDates = pacing.schoolDates.filter((d) => !d.excluded);
  const availableDays = pacing.totalDays ?? instructionalDates.length;
  const usedDays = units.reduce(
    (sum, u) => sum + u.lessons.reduce((s, l) => s + l.duration, 0),
    0
  );
  const bufferDays = Math.max(0, availableDays - usedDays);
  const allocatedBuffer = units.reduce((sum, u) => sum + u.bufferDays, 0);
  const unallocatedBuffer = Math.max(0, bufferDays - allocatedBuffer);

  const unitStats = units.map((u) => ({
    id: u.id,
    name: u.name,
    sequence: u.sequence,
    usedDays: u.lessons.reduce((s, l) => s + l.duration, 0),
    lessonCount: u.lessons.length,
    bufferDays: u.bufferDays,
  }));

  return NextResponse.json({
    pacing,
    analytics: {
      availableDays,
      usedDays,
      bufferDays,
      allocatedBuffer,
      unallocatedBuffer,
      unitStats,
      overBudget: usedDays > availableDays,
    },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const body = await request.json();
  const { totalDays } = body;

  const pacing = await prisma.pacing.upsert({
    where: { courseId },
    update: { totalDays: totalDays ?? null },
    create: { courseId, totalDays: totalDays ?? null },
    include: { schoolDates: { orderBy: { date: "asc" } } },
  });

  return NextResponse.json(pacing);
}
