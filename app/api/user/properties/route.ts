import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { authOptions } from "@/app/lib/authOptions";

// TODO: Replace with real authentication
export async function GET(_req: Request) {
  // Use NextAuth session for user identification
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
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
