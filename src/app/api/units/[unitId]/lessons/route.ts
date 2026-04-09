import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  const { unitId } = await params;
  const body = await request.json();
  const { title, description, duration } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  // Get the next sequence number
  const maxSeq = await prisma.lesson.aggregate({
    where: { unitId },
    _max: { sequence: true },
  });
  const nextSequence = (maxSeq._max.sequence ?? 0) + 1;

  const lesson = await prisma.lesson.create({
    data: {
      title,
      description: description || null,
      duration: duration || 1,
      sequence: nextSequence,
      unitId,
    },
    include: {
      textbookCorrelations: true,
      links: true,
      attachments: true,
    },
  });

  return NextResponse.json(lesson, { status: 201 });
}
