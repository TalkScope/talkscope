import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Scope = "team" | "org";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const scope = String(body?.scope ?? "team") as Scope;
    const refId = String(body?.refId ?? "").trim();
    const windowSize = Number(body?.windowSize ?? 30);

    if (!["team", "org"].includes(scope)) return new NextResponse("Invalid scope (team|org)", { status: 400 });
    if (!refId) return new NextResponse("Missing refId", { status: 400 });
    if (!Number.isFinite(windowSize) || windowSize < 10 || windowSize > 100)
      return new NextResponse("Invalid windowSize (10..100)", { status: 400 });

    // Find agents in scope
    const agents = await prisma.agent.findMany({
      where: scope === "team" ? { teamId: refId } : { team: { organizationId: refId } },
      select: { id: true },
      take: 5000,
    });

    if (agents.length === 0) return new NextResponse("No agents found for this scope", { status: 400 });

    const job = await prisma.batchJob.create({
      data: {
        scope,
        refId,
        windowSize,
        status: "queued",
        total: agents.length,
        progress: 0,
      },
      select: { id: true, total: true, status: true, scope: true, refId: true, windowSize: true },
    });

    await prisma.batchTask.createMany({
      data: agents.map((a) => ({
        jobId: job.id,
        agentId: a.id,
        windowSize,
        status: "queued",
      })),
    });

    return NextResponse.json({ ok: true, jobId: job.id, total: job.total, status: job.status });
  } catch (e: any) {
    console.error("batch_create_error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Failed to create batch job" }, { status: 500 });
  }
}
