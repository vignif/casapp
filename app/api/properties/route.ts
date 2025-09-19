import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { authOptions } from "@/app/lib/authOptions";

export async function GET() {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
  const data = await prisma.property.findMany({
    where: { ownerEmail: session.user.email },
    include: { tenant: true, maintenance: true, calendar: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
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
      ownerEmail: session.user.email,
    },
  });
  return NextResponse.json(created, { status: 201 });
}


