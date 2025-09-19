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
  const rentals = await prisma.tenantContract.findMany({
    where: { email: session.user.email } as any,
    include: { property: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rentals);
}
