import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory store for MVP (replace with DB in production)
// This makes rules available to scoring engine via global
declare global {
  // eslint-disable-next-line no-var
  var __companyRules: { title: string; content: string; savedAt: string } | null;
}

globalThis.__companyRules = globalThis.__companyRules ?? null;

export async function POST(req: Request) {
  try {

  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { title, content } = await req.json() as { title: string; content: string };
    if (!content?.trim()) {
      return NextResponse.json({ ok: false, error: "Content is required" }, { status: 400 });
    }
    globalThis.__companyRules = {
      title: title || "Company Rules",
      content: content.trim(),
      savedAt: new Date().toISOString(),
    };
    return NextResponse.json({ ok: true, title: globalThis.__companyRules.title });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed to save rules" }, { status: 500 });
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.json({
    ok: true,
    rules: globalThis.__companyRules,
  });
}
