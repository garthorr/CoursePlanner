import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const course = await prisma.course.update({
      where: { id: courseId },
      data: { isTemplate: true },
    });
    return NextResponse.json(course);
  } catch (error) {
    console.error("POST /api/courses/[courseId]/template error:", error);
    return NextResponse.json({ error: "Failed to mark as template" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const course = await prisma.course.update({
      where: { id: courseId },
      data: { isTemplate: false },
    });
    return NextResponse.json(course);
  } catch (error) {
    console.error("DELETE /api/courses/[courseId]/template error:", error);
    return NextResponse.json({ error: "Failed to unmark as template" }, { status: 500 });
  }
}
