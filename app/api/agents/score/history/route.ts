import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const agentId = String(url.searchParams.get("agentId") ?? "").trim();
    const limit = Number(url.searchParams.get("limit") ?? 30);

    if (!agentId) return new NextResponse("Missing agentId", { status: 400 });
    if (!Number.isFinite(limit) || limit < 2 || limit > 200) {
      return new NextResponse("Invalid limit (2..200)", { status: 400 });
    }

    const rows = await prisma.agentScoreHistory.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { createdAt: true, score: true, windowSize: true },
    });

    const points = rows
      .slice()
      .reverse()
      .map((r) => ({
        t: r.createdAt.toISOString(),
        score: Number(r.score),
        windowSize: r.windowSize,
      }));

    const last = points.at(-1)?.score ?? null;
    const prev = points.length >= 2 ? points.at(-2)!.score : null;

    const delta = last !== null && prev !== null ? Number((last - prev).toFixed(2)) : null;
    const direction = delta === null ? "flat" : delta > 0 ? "up" : delta < 0 ? "down" : "flat";

    // simple slope over the whole window (optional but useful)
    const first = points.at(0)?.score ?? null;
    const windowDelta = last !== null && first !== null ? Number((last - first).toFixed(2)) : null;
    const windowDirection =
      windowDelta === null ? "flat" : windowDelta > 0 ? "up" : windowDelta < 0 ? "down" : "flat";

    return NextResponse.json({
      ok: true,
      agentId,
      count: points.length,
      last,
      prev,
      delta,
      direction,
      windowDelta,
      windowDirection,
      points,
    });
  } catch (e: any) {
    console.error("agent_score_history_error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to fetch score history" },
      { status: 500 }
    );
  }
}
