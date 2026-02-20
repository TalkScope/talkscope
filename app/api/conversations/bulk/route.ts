import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { redactPII, redactionSummary } from "@/lib/pii";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ITEMS = 100;
const MAX_TRANSCRIPT_CHARS = 10_000;

type Item = {
  transcript: string;
  reportJson?: any;
  score?: number | null;
  createdAt?: string;
};

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json().catch(() => null);
    const agentId = String(body?.agentId ?? process.env.DEFAULT_AGENT_ID ?? "").trim();

    if (!agentId) return new NextResponse("Missing agentId", { status: 400 });

    // Verify agent belongs to this user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, team: { organization: { clerkUserId: userId } } },
    });
    if (!agent) return new NextResponse("Agent not found or access denied", { status: 403 });

    const items: Item[] = Array.isArray(body?.items) ? body.items : [];
    if (!items.length) return new NextResponse("Missing items[]", { status: 400 });
    if (items.length > MAX_ITEMS) return new NextResponse(`Max ${MAX_ITEMS} items`, { status: 400 });

    const data = items.map((it, idx) => {
      const rawTranscript = String(it?.transcript ?? "").trim();
      if (rawTranscript.length < 50) throw new Error(`Item ${idx}: transcript too short`);
      if (rawTranscript.length > MAX_TRANSCRIPT_CHARS) throw new Error(`Item ${idx}: transcript too long`);

      // PII Redaction — strip sensitive data before storage
      const { redacted: transcript, hits } = redactPII(rawTranscript);
      if (Object.keys(hits).length > 0) {
        console.log(`[PII] Item ${idx}: ${redactionSummary(hits)}`);
      }

      const createdAt = it?.createdAt ? new Date(it.createdAt) : undefined;
      return {
        agentId,
        transcript,
        reportJson: it?.reportJson ? JSON.stringify(it.reportJson) : null,
        score: typeof it?.score === "number" ? it.score : null,
        ...(createdAt ? { createdAt } : {}),
      };
    });

    const result = await prisma.conversation.createMany({ data, skipDuplicates: false });
    return NextResponse.json({ ok: true, inserted: result.count });
  } catch (e: any) {
    if (e?.isAuthError) return e;
    return new NextResponse(e?.message || "Bulk insert failed", { status: 500 });
  }
}
