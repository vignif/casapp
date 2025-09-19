import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { authOptions } from "@/app/lib/authOptions";

export async function POST(req: Request, { params }: any) {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
  const prop = await prisma.property.findUnique({ where: { id: params.id } });
  if (!prop || prop.ownerEmail !== session.user.email) return new NextResponse("Not found", { status: 404 });
  const body = await req.json();
  const created = await prisma.maintenanceItem.create({
    data: {
      propertyId: params.id,
      date: new Date(body.date),
      category: body.category,
      description: body.description ?? "",
      cost: body.cost ?? 0,
      paid: !!body.paid,
    },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: Request, { params }: any) {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
  const prop = await prisma.property.findUnique({ where: { id: params.id } });
  if (!prop || prop.ownerEmail !== session.user.email) return new NextResponse("Not found", { status: 404 });
  const body = await req.json();
  const updated = await prisma.maintenanceItem.update({
    where: { id: body.id },
    data: {
      date: body.date ? new Date(body.date) : undefined,
      category: body.category,
      description: body.description,
      cost: body.cost,
      paid: body.paid,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: any) {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
  const prop = await prisma.property.findUnique({ where: { id: params.id } });
  if (!prop || prop.ownerEmail !== session.user.email) return new NextResponse("Not found", { status: 404 });
  const { searchParams } = new URL(req.url);
  const mid = searchParams.get("mid");
  if (!mid) return new NextResponse("Missing mid", { status: 400 });
  await prisma.maintenanceItem.delete({ where: { id: mid } });
  return new NextResponse(null, { status: 204 });
}


