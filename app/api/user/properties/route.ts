import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

// TODO: Replace with real authentication
export async function GET(req: NextRequest) {
  // Use NextAuth session for user identification
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const properties = await prisma.property.findMany({
    where: { ownerEmail: session.user.email } as any,
    include: { tenant: true, maintenance: true, calendar: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(properties);
}
