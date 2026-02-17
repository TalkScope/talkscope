import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = (url.searchParams.get("id") ?? "").trim();
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    const agent = await prisma.agent.findUnique({
      where: { id },
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

    if (!agent) return NextResponse.json({ ok: false, error: "Agent not found" }, { status: 404 });

    const lastScore = await prisma.agentScore.findFirst({
      where: { agentId: id },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        windowSize: true,
        overallScore: true,
        communicationScore: true,
        conversionScore: true,
        riskScore: true,
        coachingPriority: true,
        strengths: true,
        weaknesses: true,
        keyPatterns: true,
      },
    });

    const trend = await prisma.agentScoreHistory.findMany({
      where: { agentId: id },
      orderBy: { createdAt: "asc" },
      take: 40,
      select: { createdAt: true, score: true, windowSize: true },
    });

    const conversations = await prisma.conversation.findMany({
      where: { agentId: id },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, createdAt: true, score: true, transcript: true },
    });

    const lastPattern = await prisma.patternReport.findFirst({
      where: { level: "agent", refId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, windowSize: true },
    });

    return NextResponse.json({
      ok: true,
      agent,
      lastScore,
      trend,
      conversations: conversations.map((c) => ({
        ...c,
        excerpt: c.transcript.slice(0, 220),
      })),
      lastPattern,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "meta/agent failed" }, { status: 500 });
  }
}
