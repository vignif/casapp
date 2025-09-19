import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET() {
  const data = await prisma.property.findMany({
    include: { tenant: true, maintenance: true, calendar: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const created = await prisma.property.create({
    data: {
      name: body.name,
      address: body.address,
      city: body.city,
      country: body.country,
      propertyType: body.propertyType,
      bedrooms: body.bedrooms ?? 0,
      bathrooms: body.bathrooms ?? 0,
      sizeSqm: body.sizeSqm ?? 0,
      value: body.value ?? null,
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}


