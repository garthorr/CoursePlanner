import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import type { AttachmentType } from "@prisma/client";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

const VALID_TYPES = new Set<AttachmentType>([
  "ASSESSMENT",
  "CLASSWORK",
  "NOTES",
  "HOMEWORK",
  "RESOURCE",
  "OTHER",
]);

function isValidType(value: string): value is AttachmentType {
  return VALID_TYPES.has(value as AttachmentType);
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Cloud link (JSON body)
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { lessonId, url, name, type } = body;

      if (!lessonId || !url || !type) {
        return NextResponse.json(
          { error: "lessonId, url, and type are required" },
          { status: 400 }
        );
      }

      if (!isValidType(type)) {
        return NextResponse.json({ error: "Invalid attachment type" }, { status: 400 });
      }

      const attachment = await prisma.attachment.create({
        data: {
          name: name || url,
          type,
          url,
          lessonId,
        },
      });

      return NextResponse.json(attachment, { status: 201 });
    }

    // File upload (multipart form data)
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const lessonId = formData.get("lessonId") as string | null;
    const typeRaw = (formData.get("type") as string | null) || "RESOURCE";

    if (!file || !lessonId) {
      return NextResponse.json({ error: "file and lessonId are required" }, { status: 400 });
    }

    if (!isValidType(typeRaw)) {
      return NextResponse.json({ error: "Invalid attachment type" }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = path.extname(file.name);
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9-_]/g, "_");
    const uniqueName = `${Date.now()}-${baseName}${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const attachment = await prisma.attachment.create({
      data: {
        name: file.name,
        type: typeRaw,
        filePath: uniqueName,
        lessonId,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: "Failed to upload" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    if (attachment.filePath) {
      try {
        await unlink(path.join(UPLOAD_DIR, attachment.filePath));
      } catch {
        // File may already be deleted
      }
    }

    await prisma.attachment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/upload error:", error);
    return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 });
  }
}
