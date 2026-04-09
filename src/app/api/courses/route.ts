import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, code } = body;

  if (!name || !code) {
    return NextResponse.json({ error: "Name and code are required" }, { status: 400 });
  }

  const course = await prisma.course.create({
    data: { name, code },
  });

  return NextResponse.json(course, { status: 201 });
}
