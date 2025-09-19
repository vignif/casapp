import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { authOptions } from "@/app/lib/authOptions";

// TODO: Replace with real authentication
export async function GET(_req: Request) {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
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
