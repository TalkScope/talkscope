import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_TAKE = 3;
const MIN_CONVS = 5;

function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function clip(s: string, max = 220) {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}

function sanitizeErrorMessage(e: any) {
  const msg = String(e?.message || e || "Task failed");

  const lower = msg.toLowerCase();
  if (lower.includes("unexpected token") || lower.includes("is not valid json")) {
    return "Model returned invalid JSON";
  }
  if (lower.includes("missing openai_api_key")) return "Missing OPENAI_API_KEY";
  if (lower.includes("not enough conversations")) return "Not enough conversations";
  if (lower.includes("timeout")) return "Timeout";
  return clip(msg, 220);
}

/**
 * Try to extract a JSON object from a model text:
 * - removes ```json fences
 * - extracts substring between first "{" and last "}"
 */
function extractJsonObjectText(raw: string) {
  let s = String(raw ?? "").trim();

  // strip code fences if any
  s = s.replace(/```json\s*/gi, "```");
  if (s.startsWith("```")) {
    s = s.replace(/^```/, "");
    const end = s.lastIndexOf("```");
    if (end !== -1) s = s.slice(0, end);
    s = s.trim();
  }

  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("Model returned non-JSON output");
  }
  return s.slice(first, last + 1);
}

function parseStrictScoreJson(raw: string) {
  const jsonText = extractJsonObjectText(raw);
  const parsed = JSON.parse(jsonText);

  // minimal validation (so we fail early with a clean error)
  const keys = [
    "overall_score",
    "communication_score",
    "conversion_score",
    "risk_score",
    "coaching_priority",
    "strengths",
    "weaknesses",
    "key_patterns",
  ];
  for (const k of keys) {
    if (!(k in parsed)) {
      throw new Error(`Model JSON missing key: ${k}`);
    }
  }
  return parsed;
}

async function scoreWithRepair(
  client: OpenAI,
  prompt: string
): Promise<{ parsed: any; raw: string; usedRepair: boolean }> {
  // 1) first attempt
  const resp1 = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [{ role: "user", content: prompt }],
    max_output_tokens: 900,
  });

  const raw1 = (resp1.output_text || "").trim();

  try {
    return { parsed: parseStrictScoreJson(raw1), raw: raw1, usedRepair: false };
  } catch (e1: any) {
    // 2) repair attempt (single retry)
    const repairPrompt = [
      "You are a JSON repair tool.",
      "Task: output ONLY valid JSON for the scoring schema described below.",
      "Rules:",
      "- Output must be a single JSON object.",
      "- No code fences. No commentary. No extra text.",
      "",
      "Schema keys required:",
      "overall_score, communication_score, conversion_score, risk_score, coaching_priority, strengths, weaknesses, key_patterns",
      "Types:",
      "- scores: number 0..100",
      "- strengths/weaknesses/key_patterns: array of short strings",
      "",
      "Here is the invalid model output. Convert it into valid JSON ONLY:",
      raw1,
    ].join("\n");

    const resp2 = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [{ role: "user", content: repairPrompt }],
      max_output_tokens: 700,
    });

    const raw2 = (resp2.output_text || "").trim();
    return { parsed: parseStrictScoreJson(raw2), raw: raw2, usedRepair: true };
  }
}

export async function POST(req: Request) {
  const { userId } = await requireAuth();

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
    // Verify ownership via refId (org or team belonging to this user)
    const owned = await prisma.organization.findFirst({
      where: { clerkUserId: userId, OR: [{ id: job.refId }, { teams: { some: { id: job.refId } } }] },
    });
    if (!owned) return new NextResponse("Not found", { status: 404 });
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

        if (convs.length < MIN_CONVS) {
          throw new Error("Not enough conversations");
        }

        const items = convs.map((c) => {
          let report: any = null;
          if (c.reportJson) {
            try {
              report = JSON.parse(c.reportJson);
            } catch {
              // ignore bad stored reportJson
            }
          }

          return {
            conversation_id: c.id,
            created_at: c.createdAt.toISOString(),
            report,
            // if no report, include excerpt to still score
            transcript_excerpt: report ? undefined : String(c.transcript || "").slice(0, 1200),
          };
        });

        const prompt = [
          "You are TalkScope Agent Scoring Engine for contact centers.",
          "Return ONLY STRICT JSON (single object). No code fences. No commentary.",
          "Required keys:",
          "overall_score, communication_score, conversion_score, risk_score, coaching_priority, strengths, weaknesses, key_patterns",
          "Rules:",
          "- Scores are numbers 0..100",
          "- strengths/weaknesses/key_patterns are arrays of short strings",
          "",
          JSON.stringify({ agent_id: t.agentId, window_size: t.windowSize, items }),
        ].join("\n");

        const { parsed, raw, usedRepair } = await scoreWithRepair(client, prompt);

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
          },
        });

        await prisma.agentScoreHistory.create({
          data: { agentId: t.agentId, score: toNum(parsed.overall_score), windowSize: t.windowSize },
        });

        await prisma.batchTask.update({
          where: { id: t.id },
          data: { status: "done", error: usedRepair ? "Repaired invalid JSON once" : null },
        });

        processed += 1;
      } catch (e: any) {
        // avoid "Unexpected token..." noise in UI
        const clean = sanitizeErrorMessage(e);

        // add a short tail if it looks like model-json issue (helps debugging without ugliness)
        let extra = "";
        const lower = String(e?.message || "").toLowerCase();
        if (lower.includes("json")) {
          extra = " (see worker logs)";
        }

        await prisma.batchTask.update({
          where: { id: t.id },
          data: { status: "failed", error: clean + extra },
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
