import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_OUTPUT_TOKENS = 1600;

const scoreSchema = {
  name: "talkscope_agent_score",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      agent_id: { type: "string" },
      window_size: { type: "integer" },

      overall_score: { type: "number", minimum: 0, maximum: 100 },
      communication_score: { type: "number", minimum: 0, maximum: 100 },
      conversion_score: { type: "number", minimum: 0, maximum: 100 },
      risk_score: { type: "number", minimum: 0, maximum: 100 }, // higher = worse risk
      coaching_priority: { type: "number", minimum: 0, maximum: 100 }, // higher = more urgent

      strengths: { type: "array", minItems: 3, maxItems: 7, items: { type: "string" } },
      weaknesses: { type: "array", minItems: 3, maxItems: 7, items: { type: "string" } },
      key_patterns: { type: "array", minItems: 3, maxItems: 8, items: { type: "string" } },
    },
    required: [
      "agent_id",
      "window_size",
      "overall_score",
      "communication_score",
      "conversion_score",
      "risk_score",
      "coaching_priority",
      "strengths",
      "weaknesses",
      "key_patterns",
    ],
  },
} as const;

function systemPrompt() {
  return [
    "You are TalkScope Agent Scoring Engine for contact centers.",
    "Goal: compute measurable scores for a single agent based on a window of recent conversations.",
    "Return strict JSON that matches the provided schema.",
    "",
    "Scoring rules (0..100):",
    "- overall_score: holistic performance",
    "- communication_score: empathy, clarity, structure, next steps",
    "- conversion_score: discovery quality, objection handling, closing/commitment, retention handling",
    "- risk_score: churn/complaint/escalation risk (higher = worse)",
    "- coaching_priority: urgency of coaching (higher = more urgent)",
    "",
    "Be specific, avoid generic filler.",
  ].join("\n");
}

async function fetchAgentWindow(agentId: string, windowSize: number) {
  return prisma.conversation.findMany({
    where: { agentId },
    orderBy: { createdAt: "desc" },
    take: windowSize,
    select: { id: true, createdAt: true, transcript: true, reportJson: true },
  });
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return new NextResponse("Missing OPENAI_API_KEY", { status: 500 });
    const client = new OpenAI({ apiKey });

    const body = await req.json();
    const agentId = String(body?.agentId ?? "").trim();
    const windowSize = Number(body?.windowSize ?? 30);

    if (!agentId) return new NextResponse("Missing agentId", { status: 400 });
    if (!Number.isFinite(windowSize) || windowSize < 10 || windowSize > 100) {
      return new NextResponse("Invalid windowSize (10..100)", { status: 400 });
    }

    const convs = await fetchAgentWindow(agentId, windowSize);
    if (convs.length < 5) return new NextResponse("Not enough conversations to score", { status: 400 });

    // Compact payload: prefer reportJson; fallback to excerpt
    const items = convs.map((c) => {
      const out: any = {
        conversation_id: c.id,
        created_at: c.createdAt.toISOString(),
      };

      if (c.reportJson) {
        try {
          out.report = JSON.parse(c.reportJson);
        } catch {
          out.report = null;
        }
      } else {
        out.transcript_excerpt = (c.transcript || "").slice(0, 1200);
      }

      return out;
    });

    const inputText = [
      "You will receive a JSON array of recent conversations for ONE agent.",
      "Each item contains conversation_id and either a prior analysis report or transcript excerpt.",
      "Task: compute agent scores and key signals.",
      "",
      JSON.stringify({ agent_id: agentId, window_size: windowSize, items }),
    ].join("\n");

    const resp = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: inputText },
      ],
      max_output_tokens: MAX_OUTPUT_TOKENS,
      text: { format: { type: "json_schema", ...scoreSchema } },
    });

    const outText = (resp as any)?.output_text;
    if (!outText || typeof outText !== "string") {
      return NextResponse.json({ ok: false, error: "OpenAI returned empty output_text" }, { status: 500 });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(outText);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Failed to parse OpenAI JSON output", raw: outText.slice(0, 2000) },
        { status: 500 }
      );
    }

    // Save snapshot
    const saved = await prisma.agentScore.create({
      data: {
        agentId,
        windowSize,

        overallScore: Number(parsed.overall_score),
        communicationScore: Number(parsed.communication_score),
        conversionScore: Number(parsed.conversion_score),
        riskScore: Number(parsed.risk_score),
        coachingPriority: Number(parsed.coaching_priority),

        strengths: JSON.stringify(parsed.strengths),
        weaknesses: JSON.stringify(parsed.weaknesses),
        keyPatterns: JSON.stringify(parsed.key_patterns),
      },
    });

    return NextResponse.json({ ok: true, score: parsed, savedId: saved.id });
  } catch (e: any) {
    console.error("agent_score_generate_error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Agent scoring failed (unknown error)" },
      { status: 500 }
    );
  }
}
