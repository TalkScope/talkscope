import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";
import OpenAI from "openai";
import { NextResponse } from "next/server";

// ====== SAFETY LIMITS (MVP defaults) ======
const MAX_TRANSCRIPT_CHARS = 10_000;
const GLOBAL_DAILY_LIMIT = 30; // total analyses per UTC day
const PER_IP_DAILY_LIMIT = 5; // per IP per UTC day
const MAX_OUTPUT_TOKENS = 900; // cap model output

// naive in-memory store (OK for MVP; replace with Redis/DB for production)
const g = globalThis as any;
g.__talkscope = g.__talkscope || {
  day: "",
  globalCount: 0,
  byIp: {} as Record<string, number>,
};

function todayKeyUTC() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}

const MODES = ["coaching", "sales", "callcenter", "leadership", "interview"] as const;
type Mode = (typeof MODES)[number];

function systemPrompt(mode: Mode) {
  switch (mode) {
    case "coaching":
      return [
        "You are TalkScope, a conversation analyst for coaching sessions.",
        "Tone: calm, precise, non-judgmental.",
        "Focus: patterns, leverage points, quality of questions, client movement.",
        "Output: concrete and actionable, no filler.",
      ].join("\n");
    case "sales":
      return [
        "You are TalkScope, a sales call analyst.",
        "Focus: discovery, objections, clarity, next steps, deal risk, missed revenue opportunities.",
        "Be specific. Avoid generic advice.",
      ].join("\n");
    case "callcenter":
      return [
        "You are TalkScope, a call center QA analyst.",
        "Focus: empathy timing, de-escalation, script compliance signals, resolution clarity, churn/retention, upsell opportunities.",
        "Be practical and measurable.",
      ].join("\n");
    case "leadership":
      return [
        "You are TalkScope, a leadership & business conversation analyst (1:1s, stakeholder meetings).",
        "Focus: clarity, alignment, accountability, influence, decisions, ownership, follow-through.",
        "Be crisp and concrete.",
      ].join("\n");
    case "interview":
      return [
        "You are TalkScope, an interview conversation analyst.",
        "Focus: structure, signal quality, bias signals, decision confidence, next steps.",
        "Be fair, specific, and actionable.",
      ].join("\n");
  }
}

export async function POST(req: Request) {
  // Create client INSIDE handler so build step doesn't require env
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return new NextResponse("Missing OPENAI_API_KEY", { status: 500 });
  const client = new OpenAI({ apiKey });

  const body = await req.json();
  const transcript = String(body?.transcript ?? "").trim();
  const modeRaw = String(body?.mode ?? "coaching").toLowerCase();
  const mode = (MODES.includes(modeRaw as Mode) ? (modeRaw as Mode) : "coaching") as Mode;

  if (transcript.length < 200) {
    return new NextResponse("Transcript is too short. Please paste more text.", { status: 400 });
  }
  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    return new NextResponse(`Transcript too long. Max ${MAX_TRANSCRIPT_CHARS} characters.`, {
      status: 400,
    });
  }

  // --- quotas ---
  const state = g.__talkscope;
  const day = todayKeyUTC();
  if (state.day !== day) {
    state.day = day;
    state.globalCount = 0;
    state.byIp = {};
  }

  const ip = getClientIp(req);
  state.byIp[ip] = state.byIp[ip] ?? 0;

  if (state.globalCount >= GLOBAL_DAILY_LIMIT) {
    return new NextResponse("Daily capacity reached. Please try again tomorrow.", { status: 429 });
  }
  if (state.byIp[ip] >= PER_IP_DAILY_LIMIT) {
    return new NextResponse("Daily limit reached for this user. Please try again tomorrow.", {
      status: 429,
    });
  }

  // consume quota
  state.globalCount += 1;
  state.byIp[ip] += 1;

  const schema = {
    name: "talkscope_report",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        summary: { type: "string" },
        topics: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 10 },
        strengths: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 10 },
        improvements: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 10 },
        next_questions: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 10 },
        action_items: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 10 },
      },
      required: ["summary", "topics", "strengths", "improvements", "next_questions", "action_items"],
    },
  } as const;

  const userPrompt = [
    "Analyze the transcript below for the selected mode.",
    "Rules:",
    "- Output must match the JSON schema exactly.",
    "- Be concise and specific. No generic filler.",
    "- Use short bullet-like sentences inside arrays.",
    "",
    "Transcript:",
    transcript,
  ].join("\n");

  try {
    const resp = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt(mode) },
        { role: "user", content: userPrompt },
      ],
      max_output_tokens: MAX_OUTPUT_TOKENS,
      text: { format: { type: "json_schema", ...schema } },
    });

    const outText = (resp as any)?.output_text;
    if (!outText || typeof outText !== "string") {
      // rollback quota
      state.globalCount = Math.max(0, state.globalCount - 1);
      state.byIp[ip] = Math.max(0, state.byIp[ip] - 1);
      return new NextResponse("OpenAI returned empty output. Try again.", { status: 500 });
    }
    const parsed = JSON.parse(outText);

    const transcriptHash = crypto.createHash("sha256").update(transcript).digest("hex");

    // ===== Save Conversation =====

const AGENT_ID = process.env.DEFAULT_AGENT_ID || "PASTE_AGENT_ID_HERE";

await prisma.conversation.create({
  data: {
    agentId: AGENT_ID,
    transcript: transcript,
    reportJson: JSON.stringify(parsed),
    score: null,
  },
});

// ===== Save Individual Report (старий функціонал залишаємо) =====

await prisma.report.create({
  data: {
    mode,
    transcriptChars: transcript.length,
    transcriptHash,
    summary: String(parsed.summary ?? ""),
    reportJson: JSON.stringify(parsed),
    ip,
  },
});


    return NextResponse.json(parsed);
  } catch (err: any) {
    // rollback quota on failure
    state.globalCount = Math.max(0, state.globalCount - 1);
    state.byIp[ip] = Math.max(0, state.byIp[ip] - 1);

    const msg =
      (err?.message as string) ||
      "OpenAI request failed. Check your API key, model access, and billing.";
    return new NextResponse(msg, { status: 500 });
  }
}
