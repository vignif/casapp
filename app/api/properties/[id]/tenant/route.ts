import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.tenantContract.delete({ where: { propertyId: params.id } });
  return new NextResponse(null, { status: 204 });
}


