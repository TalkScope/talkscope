import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeJsonParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = String(searchParams.get("id") ?? "").trim();
    const take = Number(searchParams.get("take") ?? 12);

    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        team: { include: { organization: true } },
      },
    });

    if (!agent) return NextResponse.json({ ok: false, error: "Agent not found" }, { status: 404 });

    const lastScore = await prisma.agentScore.findFirst({
      where: { agentId: id },
      orderBy: { createdAt: "desc" },
    });

    // Trend from history (if exists), otherwise make a tiny trend from AgentScore itself
    let trend = await prisma.agentScoreHistory.findMany({
      where: { agentId: id },
      orderBy: { createdAt: "asc" },
      take: Math.min(Math.max(take, 3), 50),
      select: { createdAt: true, score: true, windowSize: true },
    });

    if (!trend || trend.length === 0) {
      const recentScores = await prisma.agentScore.findMany({
        where: { agentId: id },
        orderBy: { createdAt: "asc" },
        take: Math.min(Math.max(take, 3), 50),
        select: { createdAt: true, overallScore: true, windowSize: true },
      });

      trend = recentScores.map((x) => ({
        createdAt: x.createdAt,
        score: x.overallScore,
        windowSize: x.windowSize,
      }));
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

    // Normalize lastScore JSON fields
    const normalizedLastScore = lastScore
      ? {
          createdAt: lastScore.createdAt,
          windowSize: lastScore.windowSize,
          overallScore: lastScore.overallScore,
          communicationScore: lastScore.communicationScore,
          conversionScore: lastScore.conversionScore,
          riskScore: lastScore.riskScore,
          coachingPriority: lastScore.coachingPriority,
          strengths: safeJsonParse<string[]>(lastScore.strengths, []),
          weaknesses: safeJsonParse<string[]>(lastScore.weaknesses, []),
          keyPatterns: safeJsonParse<string[]>(lastScore.keyPatterns, []),
        }
      : null;

    const normalizedConversations = conversations.map((c) => ({
      id: c.id,
      createdAt: c.createdAt,
      score: c.score ?? null,
      excerpt: c.transcript.slice(0, 260),
      transcript: c.transcript,
    }));

    const normalizedAgent = {
      id: agent.id,
      name: agent.name,
      email: agent.email ?? "",
      createdAt: agent.createdAt,
      team: agent.team
        ? {
            id: agent.team.id,
            name: agent.team.name,
            organization: agent.team.organization
              ? { id: agent.team.organization.id, name: agent.team.organization.name }
              : null,
          }
        : null,
      teamName: agent.team?.name ?? "",
      orgName: agent.team?.organization?.name ?? "",
    };

    return NextResponse.json({
      ok: true,
      agent: normalizedAgent,
      lastScore: normalizedLastScore,
      trend: trend.map((x) => ({
        createdAt: x.createdAt,
        score: Number(x.score),
        windowSize: Number(x.windowSize),
      })),
      conversations: normalizedConversations,
      lastPattern: lastPattern
        ? { id: lastPattern.id, createdAt: lastPattern.createdAt, windowSize: lastPattern.windowSize }
        : null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to load agent" },
      { status: 500 }
    );
  }
}
