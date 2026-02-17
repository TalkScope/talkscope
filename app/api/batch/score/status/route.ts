import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clip(s: string, max = 160) {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}

function cleanErr(e: any) {
  const msg = String(e ?? "").trim();
  if (!msg) return null;

  const lower = msg.toLowerCase();
  if (lower.includes("unexpected token") || lower.includes("is not valid json")) {
    return "Model returned invalid JSON";
  }
  if (lower.includes("not enough conversations")) return "Not enough conversations";
  if (lower.includes("timeout")) return "Timeout";
  if (lower.includes("openai")) return "Model/API error";
  return clip(msg, 180);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const jobId = String(url.searchParams.get("jobId") ?? "").trim();

    if (!jobId) return new NextResponse("Missing jobId", { status: 400 });

    const job = await prisma.batchJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        scope: true,
        refId: true,
        windowSize: true,
        status: true,
        progress: true,
        total: true,
        error: true,
      },
    });

    if (!job) return new NextResponse("Job not found", { status: 404 });

    const [queued, running, done, failed, tasksTotal] = await Promise.all([
      prisma.batchTask.count({ where: { jobId, status: "queued" } }),
      prisma.batchTask.count({ where: { jobId, status: "running" } }),
      prisma.batchTask.count({ where: { jobId, status: "done" } }),
      prisma.batchTask.count({ where: { jobId, status: "failed" } }),
      prisma.batchTask.count({ where: { jobId } }),
    ]);

    const total = job.total && job.total > 0 ? job.total : tasksTotal;

    // percent based on done+failed so the job reaches 100% when work is finished (even with failures)
    const finished = done + failed;
    const pct = total > 0 ? Math.round((finished / total) * 100) : 0;

    // last failures with human labels
    const lastFailedRaw = await prisma.batchTask.findMany({
      where: { jobId, status: "failed" },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        agentId: true,
        error: true,
        updatedAt: true,
        agent: {
          select: {
            name: true,
            team: {
              select: {
                name: true,
                organization: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    const lastFailed = lastFailedRaw.map((t) => ({
      agentId: t.agentId, // можно убрать совсем позже, но пусть пока останется для дебага
      agentName: t.agent?.name ?? t.agentId,
      teamName: t.agent?.team?.name ?? null,
      orgName: t.agent?.team?.organization?.name ?? null,
      error: cleanErr(t.error),
      at: t.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      ok: true,
      job: {
        ...job,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        total,
        percent: pct,
        // job.error тоже приводим к человеческому виду
        error: cleanErr(job.error),
      },
      counts: { queued, running, done, failed, total },
      lastFailed,
    });
  } catch (e: any) {
    console.error("batch_status_error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to get batch status" },
      { status: 500 }
    );
  }
}
