import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const [queued, running, done, failed] = await Promise.all([
      prisma.batchTask.count({ where: { jobId, status: "queued" } }),
      prisma.batchTask.count({ where: { jobId, status: "running" } }),
      prisma.batchTask.count({ where: { jobId, status: "done" } }),
      prisma.batchTask.count({ where: { jobId, status: "failed" } }),
    ]);

    // последние ошибки - чтобы было видно "почему"
    const lastFailed = await prisma.batchTask.findMany({
      where: { jobId, status: "failed" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { agentId: true, error: true, updatedAt: true },
    });

    const pct = job.total > 0 ? Math.round((done / job.total) * 100) : 0;

    return NextResponse.json({
      ok: true,
      job: {
        ...job,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        percent: pct,
      },
      counts: { queued, running, done, failed },
      lastFailed: lastFailed.map((t) => ({
        agentId: t.agentId,
        error: t.error,
        at: t.updatedAt.toISOString(),
      })),
    });
  } catch (e: any) {
    console.error("batch_status_error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Failed to get batch status" }, { status: 500 });
  }
}
