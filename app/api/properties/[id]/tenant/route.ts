import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { authOptions } from "@/app/lib/authOptions";

export async function PUT(req: Request, { params }: any) {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
  const prop = await prisma.property.findUnique({ where: { id: params.id } });
  if (!prop || prop.ownerEmail !== session.user.email) return new NextResponse("Not found", { status: 404 });
  const body = await req.json();
  const upserted = await prisma.tenantContract.upsert({
    where: { propertyId: params.id },
    update: {
      tenantName: body.tenantName,
      email: body.email ?? null,
      phone: body.phone ?? null,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      monthlyRent: body.monthlyRent ?? 0,
      depositHeld: body.depositHeld ?? 0,
    },
    create: {
      propertyId: params.id,
      tenantName: body.tenantName,
      email: body.email ?? null,
      phone: body.phone ?? null,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      monthlyRent: body.monthlyRent ?? 0,
      depositHeld: body.depositHeld ?? 0,
    },
  });
  return NextResponse.json(upserted);
}

export async function DELETE(_req: Request, { params }: any) {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
  const prop = await prisma.property.findUnique({ where: { id: params.id } });
  if (!prop || prop.ownerEmail !== session.user.email) return new NextResponse("Not found", { status: 404 });
  await prisma.tenantContract.delete({ where: { propertyId: params.id } });
  return new NextResponse(null, { status: 204 });
}


