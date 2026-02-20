import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const agents = await prisma.agent.findMany({
      where: { team: { organization: { clerkUserId: userId } } },
      orderBy: { createdAt: "desc" },
      include: {
        team: { include: { organization: true } },
      },
    });

    const convAgg = await prisma.conversation.groupBy({
      by: ["agentId"],
      where: { agent: { team: { organization: { clerkUserId: userId } } } },
      _count: { _all: true },
    });
    const convMap = new Map(convAgg.map(r => [r.agentId, r._count._all]));

    const scoreAgg = await prisma.agentScore.groupBy({
      by: ["agentId"],
      where: { agentId: { in: agents.map(a => a.id) } },
      _count: { _all: true },
    });
    const scoreMap = new Map(scoreAgg.map(r => [r.agentId, r._count._all]));

    const result = agents.map(a => ({
      id: a.id,
      name: a.name,
      email: a.email ?? "",
      createdAt: a.createdAt,
      team: a.team ? {
        id: a.team.id,
        name: a.team.name,
        organization: a.team.organization
          ? { id: a.team.organization.id, name: a.team.organization.name }
          : null,
      } : null,
      teamName: a.team?.name ?? "",
      orgName: a.team?.organization?.name ?? "",
      conversationsCount: convMap.get(a.id) ?? 0,
      scoresCount: scoreMap.get(a.id) ?? 0,
    }));

    return NextResponse.json({ ok: true, agents: result });
  } catch (e: any) {
    if (e?.isAuthError) return e;
    return NextResponse.json({ ok: false, error: e?.message || "Failed" }, { status: 500 });
  }
}
