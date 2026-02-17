import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const teamId = (url.searchParams.get("teamId") || "").trim();
    const orgId = (url.searchParams.get("orgId") || "").trim();

    const where: any = {};
    if (teamId) where.teamId = teamId;
    if (orgId) where.team = { organizationId: orgId };

    const agents = await prisma.agent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        team: {
          select: {
            id: true,
            name: true,
            organization: { select: { id: true, name: true } },
          },
        },
        _count: { select: { conversations: true, scores: true } },
      },
    });

    return NextResponse.json({ ok: true, agents });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to load agents" },
      { status: 500 }
    );
  }
}
