import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Prisma needs the Node runtime (not edge).
export const runtime = "nodejs";

/** Load the signed-in user's learner snapshot. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const row = await prisma.learnerState.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({ data: row?.data ?? null });
}

/** Upsert the signed-in user's learner snapshot. */
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const data = await req.json();
  await prisma.learnerState.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, data },
    update: { data },
  });
  return NextResponse.json({ ok: true });
}
