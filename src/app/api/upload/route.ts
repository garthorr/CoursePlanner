import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import type { AttachmentType } from "@prisma/client";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  // Cloud link (JSON body)
  if (contentType.includes("application/json")) {
    const body = await request.json();
    const { lessonId, url, name, type } = body;

    if (!lessonId || !url || !type) {
      return NextResponse.json({ error: "lessonId, url, and type are required" }, { status: 400 });
    }

    const attachment = await prisma.attachment.create({
      data: {
        name: name || url,
        type: type as AttachmentType,
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
  const type = (formData.get("type") as string | null) || "RESOURCE";

  if (!file || !lessonId) {
    return NextResponse.json({ error: "file and lessonId are required" }, { status: 400 });
  }

  // Create uploads directory if needed
  await mkdir(UPLOAD_DIR, { recursive: true });

  // Generate unique filename
  const ext = path.extname(file.name);
  const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9-_]/g, "_");
  const uniqueName = `${Date.now()}-${baseName}${ext}`;
  const filePath = path.join(UPLOAD_DIR, uniqueName);

  // Write file
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const attachment = await prisma.attachment.create({
    data: {
      name: file.name,
      type: type as AttachmentType,
      filePath: uniqueName,
      lessonId,
    },
  });

  return NextResponse.json(attachment, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  // Delete file from disk if it's an uploaded file
  if (attachment.filePath) {
    try {
      await unlink(path.join(UPLOAD_DIR, attachment.filePath));
    } catch {
      // File may already be deleted
    }
  }

  await prisma.attachment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
