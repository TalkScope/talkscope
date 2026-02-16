import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_ITEMS = 100;
const MAX_TRANSCRIPT_CHARS = 10_000;

type Item = {
  transcript: string;
  reportJson?: any;
  score?: number | null;
  createdAt?: string; // ISO optional
  channel?: string;   // optional metadata if you want later
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const agentId =
    String(body?.agentId ?? process.env.DEFAULT_AGENT_ID ?? "").trim();

  if (!agentId) {
    return new NextResponse(
      "Missing agentId. Provide agentId in body or set DEFAULT_AGENT_ID env.",
      { status: 400 }
    );
  }

  const items: Item[] = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) return new NextResponse("Missing items[]", { status: 400 });
  if (items.length > MAX_ITEMS)
    return new NextResponse(`Too many items. Max ${MAX_ITEMS}.`, { status: 400 });

  // Validate + normalize
  const data = items.map((it, idx) => {
    const transcript = String(it?.transcript ?? "").trim();
    if (transcript.length < 50) throw new Error(`Item ${idx}: transcript too short`);
    if (transcript.length > MAX_TRANSCRIPT_CHARS)
      throw new Error(`Item ${idx}: transcript too long (>${MAX_TRANSCRIPT_CHARS})`);

    const createdAt = it?.createdAt ? new Date(it.createdAt) : undefined;

    return {
      agentId,
      transcript,
      reportJson: it?.reportJson ? JSON.stringify(it.reportJson) : null,
      score: typeof it?.score === "number" ? it.score : null,
      ...(createdAt ? { createdAt } : {}),
    };
  });

  try {
    const result = await prisma.conversation.createMany({
      data,
      skipDuplicates: false,
    });

    return NextResponse.json({
      ok: true,
      inserted: result.count,
    });
  } catch (e: any) {
    return new NextResponse(e?.message || "Bulk insert failed", { status: 500 });
  }
}
