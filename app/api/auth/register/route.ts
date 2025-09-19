import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
// @ts-ignore - provided by custom types until deps installed
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) {
      return new NextResponse("Email and password are required", { status: 400 });
    }
  const existing = await (prisma as any).user.findUnique({ where: { email } });
    if (existing) return new NextResponse("User already exists", { status: 409 });
  const passwordHash = await (bcrypt as any).hash(password, 12);
  const user = await (prisma as any).user.create({ data: { email, passwordHash, name: name || null } });
    return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
  } catch (e) {
    console.error("Register error", e);
    return new NextResponse("Server error", { status: 500 });
  }
}
