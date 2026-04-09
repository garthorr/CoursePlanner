import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      units: {
        include: {
          lessons: {
            orderBy: { sequence: "asc" },
            include: {
              textbookCorrelations: true,
              links: true,
              attachments: true,
            },
          },
        },
        orderBy: { sequence: "asc" },
      },
      pacing: true,
    },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  return NextResponse.json(course);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const body = await request.json();
  const { name, code } = body;

  const course = await prisma.course.update({
    where: { id: courseId },
    data: { name, code },
  });

  return NextResponse.json(course);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  await prisma.course.delete({ where: { id: courseId } });
  return NextResponse.json({ success: true });
}
