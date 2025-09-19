import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { authOptions } from "@/app/lib/authOptions";

export async function GET(_req: Request, { params }: any) {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
  const data = await prisma.property.findUnique({ where: { id: params.id }, include: { tenant: true, maintenance: true, calendar: true } });
  if (!data || data.ownerEmail !== session.user.email) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: any) {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
  const existing = await prisma.property.findUnique({ where: { id: params.id } });
  if (!existing || existing.ownerEmail !== session.user.email) return new NextResponse("Not found", { status: 404 });
  const body = await req.json();
  const updated = await prisma.property.update({ where: { id: params.id }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: any) {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
  const existing = await prisma.property.findUnique({ where: { id: params.id } });
  if (!existing || existing.ownerEmail !== session.user.email) return new NextResponse("Not found", { status: 404 });
  await prisma.property.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}


