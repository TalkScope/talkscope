import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
