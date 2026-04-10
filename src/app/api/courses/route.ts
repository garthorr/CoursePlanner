import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        units: {
          include: {
            _count: { select: { lessons: true } },
          },
          orderBy: { sequence: "asc" },
        },
      },
      orderBy: { sequence: "asc" },
    });
    return NextResponse.json(courses);
  } catch (error) {
    console.error("GET /api/courses error:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: { name, code },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("POST /api/courses error:", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
