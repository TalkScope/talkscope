import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Level = "agent" | "team" | "org";

const MAX_OUTPUT_TOKENS = 2500;

const schema = {
  name: "talkscope_pattern_report",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      window_size: { type: "integer" },
      level: { type: "string" },
      ref_id: { type: "string" },

      executive_summary: { type: "string" },

      top_recurring_issues: {
        type: "array",
        minItems: 3,
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            issue: { type: "string" },
            frequency_estimate: { type: "string" },
            impact: { type: "string" },
            evidence_examples: {
              type: "array",
              minItems: 2,
              maxItems: 3,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  conversation_id: { type: "string" },
                  quote_or_moment: { type: "string" },
                  why_it_matters: { type: "string" },
                },
                required: ["conversation_id", "quote_or_moment", "why_it_matters"],
              },
            },
            root_cause_hypotheses: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
            coaching_actions: { type: "array", minItems: 2, maxItems: 6, items: { type: "string" } },
            training_recommendations: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
          },
          required: [
            "issue",
            "frequency_estimate",
            "impact",
            "evidence_examples",
            "root_cause_hypotheses",
            "coaching_actions",
            "training_recommendations",
          ],
        },
      },

      quick_wins_next_7_days: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } },
      metrics_to_track: { type: "array", minItems: 3, maxItems: 6, items: { type: "string" } },
    },
    required: [
      "window_size",
      "level",
      "ref_id",
      "executive_summary",
      "top_recurring_issues",
      "quick_wins_next_7_days",
      "metrics_to_track",
    ],
  },
} as const;

function systemPrompt(level: Level) {
  return [
    "You are TalkScope Pattern Intelligence Engine for contact centers.",
    "Your job: analyze a batch of conversations and extract recurring issues that reduce conversion or increase churn.",
    "Be concrete, measurable, and evidence-driven. No generic advice.",
    "Always provide examples linked to conversation IDs.",
    `Scope level: ${level}.`,
  ].join("\n");
}

async function fetchWindow(level: Level, refId: string, windowSize: number) {
  if (level === "agent") {
    return prisma.conversation.findMany({
      where: { agentId: refId },
      orderBy: { createdAt: "desc" },
      take: windowSize,
      select: { id: true, createdAt: true, transcript: true, reportJson: true, agentId: true },
    });
  }

  if (level === "team") {
    return prisma.conversation.findMany({
      where: { agent: { teamId: refId } },
      orderBy: { createdAt: "desc" },
      take: windowSize,
      select: { id: true, createdAt: true, transcript: true, reportJson: true, agentId: true },
    });
  }

  // org
  return prisma.conversation.findMany({
    where: { agent: { team: { organizationId: refId } } },
    orderBy: { createdAt: "desc" },
    take: windowSize,
    select: { id: true, createdAt: true, transcript: true, reportJson: true, agentId: true },
  });
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return new NextResponse("Missing OPENAI_API_KEY", { status: 500 });
    const client = new OpenAI({ apiKey });

    const body = await req.json();

    const levelRaw = String(body?.level ?? "team").toLowerCase();
    const level = (["agent", "team", "org"].includes(levelRaw) ? levelRaw : "") as Level;

    const refId = String(body?.refId ?? "").trim();
    const windowSize = Number(body?.windowSize ?? 50);

    if (!refId) return new NextResponse("Missing refId", { status: 400 });
    if (!level) return new NextResponse("Invalid level", { status: 400 });
    if (!Number.isFinite(windowSize) || windowSize < 10 || windowSize > 100)
      return new NextResponse("Invalid windowSize (10..100)", { status: 400 });

    const convs = await fetchWindow(level, refId, windowSize);
    if (convs.length < 5) return new NextResponse("Not enough conversations for pattern analysis", { status: 400 });

    // Build compact input: prefer existing per-conversation reportJson, fallback to transcript snippets
    const payload = convs.map((c) => {
      const base: any = {
        conversation_id: c.id,
        created_at: c.createdAt.toISOString(),
        agent_id: c.agentId,
      };

      if (c.reportJson) {
        try {
          base.report = JSON.parse(c.reportJson);
        } catch {
          base.report = null;
        }
      } else {
        base.transcript_excerpt = (c.transcript || "").slice(0, 1200);
      }
      return base;
    });

    const inputText = [
      "You will receive a JSON array of conversation items.",
      "Each item has conversation_id, agent_id, created_at, and either a prior report or a transcript excerpt.",
      "Task: produce a Pattern Intelligence Report following the provided JSON schema.",
      "Focus: recurring issues, missed opportunities, and weak points that affect conversion/support outcomes.",
      "",
      JSON.stringify({ level, ref_id: refId, window_size: windowSize, items: payload }),
    ].join("\n");

    const resp = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt(level) },
        { role: "user", content: inputText },
      ],
      max_output_tokens: MAX_OUTPUT_TOKENS,
      text: { format: { type: "json_schema", ...schema } },
    });

    const outText = (resp as any)?.output_text;
    if (!outText || typeof outText !== "string") {
      return NextResponse.json(
        { ok: false, error: "OpenAI returned empty output_text", debug: resp },
        { status: 500 }
      );
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

    // Save PatternReport
    const data: any = {
      level,
      refId,
      windowSize,
      reportJson: JSON.stringify(parsed),
    };

    if (level === "org") data.organizationId = refId;
    if (level === "team") data.teamId = refId;

    await prisma.patternReport.create({ data });
	
	let meta: any = null;

if (level === "agent") {
  const agent = await prisma.agent.findUnique({
    where: { id: refId },
    include: {
      team: {
        include: { organization: true },
      },
    },
  });

  if (agent) {
    meta = {
      agentName: agent.name,
      teamName: agent.team?.name ?? null,
      orgName: agent.team?.organization?.name ?? null,
    };
  }
}

return NextResponse.json({ ok: true, meta, report: parsed });

    return NextResponse.json(parsed);
  } catch (e: any) {
    console.error("patterns_generate_error:", e);

    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "Pattern generation failed (unknown error)",
        name: e?.name,
      },
      { status: 500 }
    );
  }
}
