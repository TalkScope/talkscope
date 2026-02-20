import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: Request) {
  return handleDelete(req);
}

export async function POST(req: Request) {
  return handleDelete(req);
}

async function handleDelete(req: Request) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    const conv = await prisma.conversation.findFirst({
      where: { id, agent: { team: { organization: { clerkUserId: userId } } } },
      select: { id: true },
    });
    if (!conv) return NextResponse.json({ ok: false, error: "Not found or access denied" }, { status: 404 });

    await prisma.conversation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.isAuthError) return e;
    return NextResponse.json({ ok: false, error: e?.message || "Failed" }, { status: 500 });
  }
}
