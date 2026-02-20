import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEMO_USER_ID = "user_39vlY625s0Maj4GvJp5vPJvB7xU";

export async function POST() {
  try {
    const clerk = await clerkClient();
    
    // Create a sign-in token for the demo user
    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: DEMO_USER_ID,
      expiresInSeconds: 3600, // 1 hour
    });

    return NextResponse.json({ ok: true, token: signInToken.token });
  } catch (e: any) {
    console.error("Demo login error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Failed" }, { status: 500 });
  }
}
