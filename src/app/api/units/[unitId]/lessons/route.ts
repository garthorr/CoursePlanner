import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  try {
    const { unitId } = await params;
    const body = await request.json();
    const { title, description, duration, textbookCorrelations, links } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const maxSeq = await prisma.lesson.aggregate({
      where: { unitId },
      _max: { sequence: true },
    });
    const nextSequence = (maxSeq._max.sequence ?? 0) + 1;

    const lesson = await prisma.$transaction(async (tx) => {
      const created = await tx.lesson.create({
        data: {
          title,
          description: description || null,
          duration: duration || 1,
          sequence: nextSequence,
          unitId,
        },
      });

      if (Array.isArray(textbookCorrelations) && textbookCorrelations.length > 0) {
        await tx.textbookCorrelation.createMany({
          data: textbookCorrelations
            .filter((c: { textbook: string }) => c.textbook?.trim())
            .map((c: { textbook: string; reference: string }) => ({
              textbook: c.textbook,
              reference: c.reference || "",
              lessonId: created.id,
            })),
        });
      }

      if (Array.isArray(links) && links.length > 0) {
        await tx.lessonLink.createMany({
          data: links
            .filter((l: { url: string }) => l.url?.trim())
            .map((l: { url: string; label?: string | null }) => ({
              url: l.url,
              label: l.label || null,
              lessonId: created.id,
            })),
        });
      }

      return tx.lesson.findUnique({
        where: { id: created.id },
        include: {
          textbookCorrelations: true,
          links: true,
          attachments: true,
        },
      });
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error("POST /api/units/[unitId]/lessons error:", error);
    return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 });
  }
}
