import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  const course = await prisma.course.update({
    where: { id: courseId },
    data: { isTemplate: true },
  });

  return NextResponse.json(course);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  const course = await prisma.course.update({
    where: { id: courseId },
    data: { isTemplate: false },
  });

  return NextResponse.json(course);
}
