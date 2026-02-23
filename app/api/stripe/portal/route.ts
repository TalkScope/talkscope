import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { userId } = await requireAuth();

    const sub = await prisma.subscription.findFirst({
      where: { clerkUserId: userId },
    });

    if (!sub?.stripeCustomerId) {
      return NextResponse.json({ ok: false, error: "No billing account found" }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app/account`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (e: any) {
    if (e?.isAuthError) return e;
    console.error("stripe_portal_error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Failed" }, { status: 500 });
  }
}
