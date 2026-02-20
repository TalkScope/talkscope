import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const DEMO_USER_ID = "user_39vlY625s0Maj4GvJp5vPJvB7xU";

/**
 * Returns { userId } if authenticated, or throws a 401 NextResponse.
 * Use in API routes: const { userId } = await requireAuth();
 */
export async function requireAuth(): Promise<{ userId: string }> {
  const { userId } = await auth();
  if (!userId) {
    throw Object.assign(
      NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
      { isAuthError: true }
    );
  }
  return { userId };
}

/**
 * Returns userId or null (no throw). For optional auth checks.
 */
export async function getAuthUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}

/**
 * Throws a 403 if the current user is the demo account.
 * Use for destructive or expensive actions that should be blocked in demo.
 */
export async function requireNonDemo(): Promise<{ userId: string }> {
  const { userId } = await requireAuth();
  if (userId === DEMO_USER_ID) {
    throw Object.assign(
      NextResponse.json({ ok: false, error: "This action is not available in demo mode. Please create a free account." }, { status: 403 }),
      { isAuthError: true }
    );
  }
  return { userId };
}
