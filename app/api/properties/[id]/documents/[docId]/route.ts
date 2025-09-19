import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { unlink } from "fs/promises";
import { join } from "path";
import { authOptions } from "@/app/lib/authOptions";

export async function DELETE(_req: Request, { params }: any) {
  try {
    const { getServerSession } = await import("next-auth");
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
    const document = await prisma.propertyDocument.findUnique({
      where: { id: params.docId },
    });

    if (!document) {
      return new NextResponse("Document not found", { status: 404 });
    }

    const prop = await prisma.property.findUnique({ where: { id: params.id } });
    if (!prop || prop.ownerEmail !== session.user.email) return new NextResponse("Not found", { status: 404 });

    // Delete file from filesystem
    try {
  const filePath = join(process.cwd(), document.filePath);
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
