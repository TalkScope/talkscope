import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1) Base agents + team/org
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        team: {
          include: {
            organization: true,
          },
        },
      },
    });

    // 2) Conversations count per agent
    const convAgg = await prisma.conversation.groupBy({
      by: ["agentId"],
      _count: { _all: true },
    });

    const convMap = new Map<string, number>();
    for (const row of convAgg) convMap.set(row.agentId, row._count._all);

    // 3) Scores count per agent (AgentScore не связан relation-ом, поэтому считаем отдельно)
    const scoreAgg = await prisma.agentScore.groupBy({
      by: ["agentId"],
      _count: { _all: true },
    });

    const scoreMap = new Map<string, number>();
    for (const row of scoreAgg) scoreMap.set(row.agentId, row._count._all);

    const result = agents.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email ?? "",
      createdAt: a.createdAt,
      team: a.team
        ? {
            id: a.team.id,
            name: a.team.name,
            organization: a.team.organization
              ? { id: a.team.organization.id, name: a.team.organization.name }
              : null,
          }
        : null,
      teamName: a.team?.name ?? "",
      orgName: a.team?.organization?.name ?? "",
      conversationsCount: convMap.get(a.id) ?? 0,
      scoresCount: scoreMap.get(a.id) ?? 0,
    }));

    return NextResponse.json({ ok: true, agents: result });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to load agents" },
      { status: 500 }
    );
  }
}
