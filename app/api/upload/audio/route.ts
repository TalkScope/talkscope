import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redactPII, redactionSummary } from "@/lib/pii";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB — Whisper limit
const ALLOWED_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/webm", "video/mp4"];

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const agentId = String(formData.get("agentId") ?? "").trim();

    if (!file) return new NextResponse("No file uploaded", { status: 400 });
    if (!agentId) return new NextResponse("Missing agentId", { status: 400 });

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new NextResponse(
        `File too large. Max 25MB. Your file: ${(file.size / 1024 / 1024).toFixed(1)}MB`,
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = file.type || "";
    const fileName = file.name.toLowerCase();
    const isAllowedType = ALLOWED_TYPES.includes(fileType) ||
      fileName.endsWith(".mp3") || fileName.endsWith(".wav") ||
      fileName.endsWith(".m4a") || fileName.endsWith(".mp4") ||
      fileName.endsWith(".webm");

    if (!isAllowedType) {
      return new NextResponse(
        "Unsupported format. Please upload MP3, WAV, M4A, or MP4.",
        { status: 400 }
      );
    }

    // Verify agent belongs to this user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, team: { organization: { clerkUserId: userId } } },
      select: { id: true, name: true },
    });
    if (!agent) return new NextResponse("Agent not found or access denied", { status: 403 });

    // Initialize OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return new NextResponse("OpenAI API key not configured", { status: 500 });
    const openai = new OpenAI({ apiKey });

    // Transcribe with Whisper
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a File object for OpenAI SDK
    const audioFile = new File([buffer], file.name, { type: file.type || "audio/mpeg" });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "text",
      language: "en", // auto-detect if omitted, but "en" is faster
    });

    const rawTranscript = String(transcription).trim();

    if (!rawTranscript || rawTranscript.length < 50) {
      return new NextResponse(
        "Transcription too short or empty. Please check your audio file has clear speech.",
        { status: 400 }
      );
    }

    // PII Redaction
    const { redacted: transcript, hits } = redactPII(rawTranscript);
    if (Object.keys(hits).length > 0) {
      console.log(`[PII] audio upload: ${redactionSummary(hits)}`);
    }

    // Save conversation
    const conversation = await prisma.conversation.create({
      data: {
        agentId,
        transcript,
        score: null,
      },
    });

    return NextResponse.json({
      ok: true,
      conversationId: conversation.id,
      agentId,
      agentName: agent.name,
      transcriptLength: transcript.length,
      durationEstimate: `~${Math.round(transcript.split(" ").length / 130)} min`,
      piiRedacted: Object.keys(hits).length > 0,
      piiSummary: redactionSummary(hits),
      transcript: transcript.slice(0, 500) + (transcript.length > 500 ? "..." : ""),
    });
  } catch (e: any) {
    console.error("[audio upload]", e);
    if (e?.isAuthError) return e;
    return new NextResponse(e?.message || "Audio upload failed", { status: 500 });
  }
}
