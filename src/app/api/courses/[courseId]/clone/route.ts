import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const body = await request.json();
  const { name, code } = body;

  const source = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      units: {
        include: {
          lessons: {
            include: {
              textbookCorrelations: true,
              links: true,
            },
            orderBy: { sequence: "asc" },
          },
        },
        orderBy: { sequence: "asc" },
      },
    },
  });

  if (!source) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const cloned = await prisma.$transaction(async (tx) => {
    // Create the new course
    const newCourse = await tx.course.create({
      data: {
        name: name || `${source.name} (Copy)`,
        code: code || source.code,
        isTemplate: false,
      },
    });

    // Clone units and lessons
    for (const unit of source.units) {
      const newUnit = await tx.unit.create({
        data: {
          name: unit.name,
          sequence: unit.sequence,
          bufferDays: 0, // Reset buffer days for clone
          courseId: newCourse.id,
        },
      });

      for (const lesson of unit.lessons) {
        const newLesson = await tx.lesson.create({
          data: {
            title: lesson.title,
            description: lesson.description,
            duration: lesson.duration,
            sequence: lesson.sequence,
            unitId: newUnit.id,
          },
        });

        // Clone textbook correlations
        if (lesson.textbookCorrelations.length > 0) {
          await tx.textbookCorrelation.createMany({
            data: lesson.textbookCorrelations.map((tc) => ({
              textbook: tc.textbook,
              reference: tc.reference,
              lessonId: newLesson.id,
            })),
          });
        }

        // Clone links
        if (lesson.links.length > 0) {
          await tx.lessonLink.createMany({
            data: lesson.links.map((l) => ({
              url: l.url,
              label: l.label,
              lessonId: newLesson.id,
            })),
          });
        }
        // Note: File attachments are NOT cloned (instance-specific)
      }
    }

    return newCourse;
  });

  return NextResponse.json(cloned, { status: 201 });
}
