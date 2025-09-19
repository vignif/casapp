import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const documents = await prisma.propertyDocument.findMany({
    where: { propertyId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(documents);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string;

    if (!file || !name || !type) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "uploads", params.id);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = join(uploadsDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save document record
    const document = await prisma.propertyDocument.create({
      data: {
        name,
        type,
        fileName,
        filePath: `/uploads/${params.id}/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
        description: description || null,
        propertyId: params.id,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error uploading document:", error);
    return new NextResponse("Error uploading document", { status: 500 });
  }
}
