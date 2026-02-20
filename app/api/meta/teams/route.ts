import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = new URL(req.url);
    const orgId = (searchParams.get("orgId") ?? "").trim();

    const teams = await prisma.team.findMany({
      where: {
        organization: { clerkUserId: userId },
        ...(orgId ? { organizationId: orgId } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        organizationId: true,
        createdAt: true,
        _count: { select: { agents: true } },
      },
    });

    return NextResponse.json({ ok: true, teams });
  } catch (e: any) {
    if (e?.isAuthError) return e;
    return NextResponse.json({ ok: false, error: e?.message || "Failed" }, { status: 500 });
  }
}
