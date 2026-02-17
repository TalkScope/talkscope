import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const teamId = (url.searchParams.get("teamId") ?? "").trim();
    const orgId = (url.searchParams.get("orgId") ?? "").trim();

    const where: any = {};
    if (teamId) where.teamId = teamId;
    if (orgId) where.team = { organizationId: orgId };

    // 1) агенты + org/team + count conversations (это relation существует)
    const agents = await prisma.agent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        team: {
          select: {
            id: true,
            name: true,
            organization: { select: { id: true, name: true } },
          },
        },
        _count: { select: { conversations: true } },
      },
    });

    const agentIds = agents.map((a) => a.id);
    if (agentIds.length === 0) {
      return NextResponse.json({ ok: true, agents: [] });
    }

    // 2) count score snapshots (AgentScore) — НЕ relation, считаем groupBy
    const scoreCounts = await prisma.agentScore.groupBy({
      by: ["agentId"],
      where: { agentId: { in: agentIds } },
      _count: { _all: true },
    });

    const scoresByAgentId = new Map<string, number>();
    for (const row of scoreCounts) {
      scoresByAgentId.set(row.agentId, row._count._all);
    }

    // 3) собрать красиво
    const out = agents.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      createdAt: a.createdAt,
      team: a.team,
      conversationsCount: a._count.conversations,
      scoresCount: scoresByAgentId.get(a.id) ?? 0,
    }));

    return NextResponse.json({ ok: true, agents: out });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "meta/agents failed" },
      { status: 500 }
    );
  }
}
