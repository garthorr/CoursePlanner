import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const body = await request.json();
  const { startDate, endDate, excludedDates, weekdays } = body;

  // Ensure pacing exists
  let pacing = await prisma.pacing.findUnique({ where: { courseId } });
  if (!pacing) {
    pacing = await prisma.pacing.create({ data: { courseId } });
  }

  // Generate school dates between start and end
  const start = new Date(startDate);
  const end = new Date(endDate);
  const excluded = new Set((excludedDates || []).map((d: string) => d));
  const activeWeekdays = new Set(weekdays || [1, 2, 3, 4, 5]); // Mon-Fri default

  const dates: { date: Date; excluded: boolean }[] = [];
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    if (activeWeekdays.has(dayOfWeek)) {
      const dateStr = current.toISOString().split("T")[0];
      dates.push({
        date: new Date(current),
        excluded: excluded.has(dateStr),
      });
    }
    current.setDate(current.getDate() + 1);
  }

  // Replace all existing dates
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

    // Update totalDays to match instructional count
    const instructionalCount = dates.filter((d) => !d.excluded).length;
    await tx.pacing.update({
      where: { id: pacing!.id },
      data: { totalDays: instructionalCount },
    });
  });

  return NextResponse.json({ totalDates: dates.length, instructionalDays: dates.filter((d) => !d.excluded).length });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const body = await request.json();
  const { dateId, excluded } = body;

  const pacing = await prisma.pacing.findUnique({ where: { courseId } });
  if (!pacing) {
    return NextResponse.json({ error: "Pacing not found" }, { status: 404 });
  }

  await prisma.schoolDate.update({
    where: { id: dateId },
    data: { excluded },
  });

  // Recalculate total days
  const instructionalCount = await prisma.schoolDate.count({
    where: { pacingId: pacing.id, excluded: false },
  });
  await prisma.pacing.update({
    where: { id: pacing.id },
    data: { totalDays: instructionalCount },
  });

  return NextResponse.json({ success: true });
}
