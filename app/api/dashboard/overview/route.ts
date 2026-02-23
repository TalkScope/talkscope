import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function GET(req: Request) {
  try {

  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    if (!Number.isFinite(limit) || limit < 5 || limit > 200) {
      return new NextResponse("Invalid limit (5..200)", { status: 400 });
    }

    // 1) Latest score per agent (simple approach: fetch recent scores and reduce in memory)
    const recent = await prisma.agentScore.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        agentId: true,
        createdAt: true,
        overallScore: true,
        communicationScore: true,
        conversionScore: true,
        riskScore: true,
        coachingPriority: true,
        windowSize: true,
      },
    });

    const latestByAgent = new Map<string, (typeof recent)[number]>();
    for (const row of recent) {
      if (!latestByAgent.has(row.agentId)) latestByAgent.set(row.agentId, row);
    }
    const latest = Array.from(latestByAgent.values());

    // 2) Buckets
    const totalAgents = latest.length;

    const highRisk = latest
      .filter((a) => toNum(a.riskScore) >= 70)
      .sort((a, b) => toNum(b.riskScore) - toNum(a.riskScore))
      .slice(0, limit);

    const coachingQueue = latest
      .sort((a, b) => toNum(b.coachingPriority) - toNum(a.coachingPriority))
      .slice(0, limit);

    const topPerformers = latest
      .sort((a, b) => toNum(b.overallScore) - toNum(a.overallScore))
      .slice(0, limit);

    const lowPerformers = latest
      .sort((a, b) => toNum(a.overallScore) - toNum(b.overallScore))
      .slice(0, limit);

    // 3) Quick system stats (conversations + reports)
    const [conversationsCount, patternReportsCount, agentScoresCount] = await Promise.all([
      prisma.conversation.count(),
      prisma.patternReport.count().catch(() => 0),
      prisma.agentScore.count().catch(() => 0),
    ]);

    return NextResponse.json({
      ok: true,
      stats: {
        totalAgents,
        conversationsCount,
        patternReportsCount,
        agentScoresCount,
      },
      highRisk: highRisk.map((a) => ({
        agentId: a.agentId,
        risk: toNum(a.riskScore),
        overall: toNum(a.overallScore),
        coachingPriority: toNum(a.coachingPriority),
        at: a.createdAt.toISOString(),
      })),
      coachingQueue: coachingQueue.map((a) => ({
        agentId: a.agentId,
        coachingPriority: toNum(a.coachingPriority),
        overall: toNum(a.overallScore),
        risk: toNum(a.riskScore),
        at: a.createdAt.toISOString(),
      })),
      topPerformers: topPerformers.map((a) => ({
        agentId: a.agentId,
        overall: toNum(a.overallScore),
        communication: toNum(a.communicationScore),
        conversion: toNum(a.conversionScore),
        risk: toNum(a.riskScore),
        at: a.createdAt.toISOString(),
      })),
      lowPerformers: lowPerformers.map((a) => ({
        agentId: a.agentId,
        overall: toNum(a.overallScore),
        communication: toNum(a.communicationScore),
        conversion: toNum(a.conversionScore),
        risk: toNum(a.riskScore),
        coachingPriority: toNum(a.coachingPriority),
        at: a.createdAt.toISOString(),
      })),
    });
  } catch (e: any) {
    console.error("dashboard_overview_error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to build dashboard overview" },
      { status: 500 }
    );
  }
}
