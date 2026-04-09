import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      textbookCorrelations: true,
      links: true,
      attachments: true,
      unit: { include: { course: true } },
    },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  return NextResponse.json(lesson);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const body = await request.json();
  const { title, description, duration } = body;

  const lesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(duration !== undefined && { duration }),
    },
    include: {
      textbookCorrelations: true,
      links: true,
      attachments: true,
    },
  });

  return NextResponse.json(lesson);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.lesson.delete({ where: { id: lessonId } });

    // Resequence remaining lessons in the unit
    const remaining = await tx.lesson.findMany({
      where: { unitId: lesson.unitId },
      orderBy: { sequence: "asc" },
    });
    for (let i = 0; i < remaining.length; i++) {
      await tx.lesson.update({
        where: { id: remaining[i].id },
        data: { sequence: i + 1 },
      });
    }
  });

  return NextResponse.json({ success: true });
}
