import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const data = await prisma.property.findUnique({
    where: { id: params.id },
    include: { tenant: true, maintenance: true, calendar: true },
  });
  if (!data) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = await prisma.property.update({
    where: { id: params.id },
    data: body,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.property.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}


