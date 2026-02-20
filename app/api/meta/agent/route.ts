import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeJsonParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; }
  catch { return fallback; }
}

export async function GET(req: Request) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = new URL(req.url);
    const id = String(searchParams.get("id") ?? "").trim();
    const take = Number(searchParams.get("take") ?? 12);

    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    const agent = await prisma.agent.findFirst({
      where: {
        id,
        team: { organization: { clerkUserId: userId } },
      },
      include: { team: { include: { organization: true } } },
    });

    if (!agent) return NextResponse.json({ ok: false, error: "Agent not found" }, { status: 404 });

    const lastScore = await prisma.agentScore.findFirst({
      where: { agentId: id },
      orderBy: { createdAt: "desc" },
    });

    let trend = await prisma.agentScoreHistory.findMany({
      where: { agentId: id },
      orderBy: { createdAt: "asc" },
      take: Math.min(Math.max(take, 3), 50),
      select: { createdAt: true, score: true, windowSize: true },
    });

    if (!trend.length) {
      const recentScores = await prisma.agentScore.findMany({
        where: { agentId: id },
        orderBy: { createdAt: "asc" },
        take: Math.min(Math.max(take, 3), 50),
        select: { createdAt: true, overallScore: true, windowSize: true },
      });
      trend = recentScores.map(x => ({ createdAt: x.createdAt, score: x.overallScore, windowSize: x.windowSize }));
    }

    const conversations = await prisma.conversation.findMany({
      where: { agentId: id },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, createdAt: true, score: true, transcript: true },
    });

    const lastPattern = await prisma.patternReport.findFirst({
      where: { level: "agent", refId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, windowSize: true, reportJson: true },
    });

    return NextResponse.json({
      ok: true,
      agent: {
        id: agent.id, name: agent.name, email: agent.email ?? "", createdAt: agent.createdAt,
        team: agent.team ? { id: agent.team.id, name: agent.team.name, organization: agent.team.organization ? { id: agent.team.organization.id, name: agent.team.organization.name } : null } : null,
        teamName: agent.team?.name ?? "", orgName: agent.team?.organization?.name ?? "",
      },
      lastScore: lastScore ? {
        createdAt: lastScore.createdAt, windowSize: lastScore.windowSize,
        overallScore: lastScore.overallScore, communicationScore: lastScore.communicationScore,
        conversionScore: lastScore.conversionScore, riskScore: lastScore.riskScore,
        coachingPriority: lastScore.coachingPriority,
        strengths: safeJsonParse<string[]>(lastScore.strengths, []),
        weaknesses: safeJsonParse<string[]>(lastScore.weaknesses, []),
        keyPatterns: safeJsonParse<string[]>(lastScore.keyPatterns, []),
      } : null,
      trend: trend.map(x => ({ createdAt: x.createdAt, score: Number(x.score), windowSize: Number(x.windowSize) })),
      conversations: conversations.map(c => ({ id: c.id, createdAt: c.createdAt, score: c.score ?? null, excerpt: c.transcript.slice(0, 260), transcript: c.transcript })),
      lastPattern: lastPattern ? { id: lastPattern.id, createdAt: lastPattern.createdAt, windowSize: lastPattern.windowSize } : null,
    });
  } catch (e: any) {
    if (e?.isAuthError) return e;
    return NextResponse.json({ ok: false, error: e?.message || "Failed" }, { status: 500 });
  }
}
