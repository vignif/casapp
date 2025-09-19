import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { unlink } from "fs/promises";
import { join } from "path";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; docId: string } }) {
  try {
    const document = await prisma.propertyDocument.findUnique({
      where: { id: params.docId },
    });

    if (!document) {
      return new NextResponse("Document not found", { status: 404 });
    }

    // Delete file from filesystem
    try {
      const filePath = join(process.cwd(), "public", document.filePath);
      await unlink(filePath);
    } catch (error) {
      console.warn("Could not delete file:", error);
    }

    // Delete document record
    await prisma.propertyDocument.delete({
      where: { id: params.docId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting document:", error);
    return new NextResponse("Error deleting document", { status: 500 });
  }
}
