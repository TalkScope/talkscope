import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_TAKE = 3;

function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return new NextResponse("Missing OPENAI_API_KEY", { status: 500 });
  const client = new OpenAI({ apiKey });

  try {
    const body = await req.json().catch(() => ({}));
    const jobId = String(body?.jobId ?? "").trim();
    const take = Math.min(Math.max(toNum(body?.take ?? DEFAULT_TAKE), 1), 10);

    if (!jobId) return new NextResponse("Missing jobId", { status: 400 });

    const job = await prisma.batchJob.findUnique({ where: { id: jobId } });
    if (!job) return new NextResponse("Job not found", { status: 404 });
    if (job.status === "done") return NextResponse.json({ ok: true, jobId, status: "done" });

    await prisma.batchJob.update({ where: { id: jobId }, data: { status: "running" } });

    const tasks = await prisma.batchTask.findMany({
      where: { jobId, status: "queued" },
      orderBy: { createdAt: "asc" },
      take,
      select: { id: true, agentId: true, windowSize: true },
    });

    if (tasks.length === 0) {
      await prisma.batchJob.update({ where: { id: jobId }, data: { status: "done" } });
      return NextResponse.json({ ok: true, jobId, status: "done" });
    }

    let processed = 0;

    for (const t of tasks) {
      await prisma.batchTask.update({ where: { id: t.id }, data: { status: "running" } });

      try {
        const convs = await prisma.conversation.findMany({
          where: { agentId: t.agentId },
          orderBy: { createdAt: "desc" },
          take: t.windowSize,
          select: { id: true, createdAt: true, reportJson: true, transcript: true },
        });

        if (convs.length < 5) throw new Error("Not enough conversations");

        const items = convs.map((c) => {
          let report: any = null;
          if (c.reportJson) {
            try {
              report = JSON.parse(c.reportJson);
            } catch {}
          }
          return {
            conversation_id: c.id,
            created_at: c.createdAt.toISOString(),
            report,
            transcript_excerpt: report ? undefined : c.transcript.slice(0, 1200),
          };
        });

        const prompt = [
          "You are TalkScope Agent Scoring Engine for contact centers.",
          "Return STRICT JSON with keys:",
          "overall_score, communication_score, conversion_score, risk_score, coaching_priority, strengths, weaknesses, key_patterns",
          "Scores are 0..100. strengths/weaknesses/key_patterns are arrays of short strings.",
          "",
          JSON.stringify({ agent_id: t.agentId, window_size: t.windowSize, items }),
        ].join("\n");

        const resp = await client.responses.create({
          model: "gpt-4.1-mini",
          input: [{ role: "user", content: prompt }],
          max_output_tokens: 900,
        });

        const raw = resp.output_text.trim();
        const parsed = JSON.parse(raw);

        await prisma.agentScore.create({
          data: {
            agentId: t.agentId,
            windowSize: t.windowSize,
            overallScore: toNum(parsed.overall_score),
            communicationScore: toNum(parsed.communication_score),
            conversionScore: toNum(parsed.conversion_score),
            riskScore: toNum(parsed.risk_score),
            coachingPriority: toNum(parsed.coaching_priority),
            strengths: JSON.stringify(parsed.strengths ?? []),
            weaknesses: JSON.stringify(parsed.weaknesses ?? []),
            keyPatterns: JSON.stringify(parsed.key_patterns ?? []),
          } as any,
        });

        await prisma.agentScoreHistory.create({
          data: { agentId: t.agentId, score: toNum(parsed.overall_score), windowSize: t.windowSize },
        });

        await prisma.batchTask.update({ where: { id: t.id }, data: { status: "done" } });
        processed += 1;
      } catch (e: any) {
        await prisma.batchTask.update({
          where: { id: t.id },
          data: { status: "failed", error: e?.message || "Task failed" },
        });
      }
    }

    const [queued, done, failed] = await Promise.all([
      prisma.batchTask.count({ where: { jobId, status: "queued" } }),
      prisma.batchTask.count({ where: { jobId, status: "done" } }),
      prisma.batchTask.count({ where: { jobId, status: "failed" } }),
    ]);

    await prisma.batchJob.update({
      where: { id: jobId },
      data: {
        progress: done,
        status: queued === 0 ? "done" : "running",
        error: failed > 0 ? `failed_tasks=${failed}` : null,
      },
    });

    return NextResponse.json({ ok: true, jobId, processed, queued, done, failed });
  } catch (e: any) {
    console.error("batch_run_error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Batch worker failed" }, { status: 500 });
  }
}
