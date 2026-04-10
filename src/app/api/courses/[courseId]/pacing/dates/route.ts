import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const body = await request.json();
    const { startDate, endDate, excludedDates, weekdays } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    if (start > end) {
      return NextResponse.json(
        { error: "startDate must be before endDate" },
        { status: 400 }
      );
    }

    let pacing = await prisma.pacing.findUnique({ where: { courseId } });
    if (!pacing) {
      pacing = await prisma.pacing.create({ data: { courseId } });
    }

    const excluded = new Set((excludedDates || []).map((d: string) => d));
    const activeWeekdays = new Set(weekdays || [1, 2, 3, 4, 5]);

    const dates: { date: Date; excluded: boolean }[] = [];
    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (activeWeekdays.has(dayOfWeek)) {
        const dateStr = current.toISOString().split("T")[0];
        dates.push({
          date: new Date(current),
          excluded: excluded.has(dateStr),
        });
      }
      current.setDate(current.getDate() + 1);
    }

    await prisma.$transaction(async (tx) => {
      await tx.schoolDate.deleteMany({ where: { pacingId: pacing!.id } });
      if (dates.length > 0) {
        await tx.schoolDate.createMany({
          data: dates.map((d) => ({
            date: d.date,
            excluded: d.excluded,
            pacingId: pacing!.id,
          })),
        });
      }

      const instructionalCount = dates.filter((d) => !d.excluded).length;
      await tx.pacing.update({
        where: { id: pacing!.id },
        data: { totalDays: instructionalCount },
      });
    });

    return NextResponse.json({
      totalDates: dates.length,
      instructionalDays: dates.filter((d) => !d.excluded).length,
    });
  } catch (error) {
    console.error("POST /api/courses/[courseId]/pacing/dates error:", error);
    return NextResponse.json({ error: "Failed to generate school dates" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const body = await request.json();
    const { dateId, excluded } = body;

    if (!dateId || typeof excluded !== "boolean") {
      return NextResponse.json(
        { error: "dateId and excluded are required" },
        { status: 400 }
      );
    }

    const pacing = await prisma.pacing.findUnique({ where: { courseId } });
    if (!pacing) {
      return NextResponse.json({ error: "Pacing not found" }, { status: 404 });
    }

    const existing = await prisma.schoolDate.findUnique({ where: { id: dateId } });
    if (!existing || existing.pacingId !== pacing.id) {
      return NextResponse.json({ error: "School date not found" }, { status: 404 });
    }

    await prisma.schoolDate.update({
      where: { id: dateId },
      data: { excluded },
    });

    const instructionalCount = await prisma.schoolDate.count({
      where: { pacingId: pacing.id, excluded: false },
    });
    await prisma.pacing.update({
      where: { id: pacing.id },
      data: { totalDays: instructionalCount },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/courses/[courseId]/pacing/dates error:", error);
    return NextResponse.json({ error: "Failed to update school date" }, { status: 500 });
  }
}
