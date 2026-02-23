import { NextResponse } from "next/server";
import { requireNonDemo } from "@/lib/auth";
import { stripe, PLANS, PlanKey } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId } = await requireNonDemo();
    const { plan } = await req.json() as { plan: PlanKey };

    if (!PLANS[plan]) {
      return NextResponse.json({ ok: false, error: "Invalid plan" }, { status: 400 });
    }

    // Get or create the user's organization
    const org = await prisma.organization.findFirst({
      where: { clerkUserId: userId },
      include: { subscription: true },
    });

    if (!org) {
      return NextResponse.json({ ok: false, error: "No organization found" }, { status: 404 });
    }

    // Get or create Stripe customer
    let customerId = org.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { clerkUserId: userId, organizationId: org.id },
      });
      customerId = customer.id;

      // Upsert subscription record with customer ID
      await prisma.subscription.upsert({
        where: { organizationId: org.id },
        update: { stripeCustomerId: customerId },
        create: {
          organizationId: org.id,
          clerkUserId: userId,
          stripeCustomerId: customerId,
          plan: "free",
          status: "inactive",
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app/account?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?checkout=canceled`,
      metadata: { clerkUserId: userId, organizationId: org.id, plan },
      subscription_data: {
        metadata: { clerkUserId: userId, organizationId: org.id, plan },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (e: any) {
    if (e?.isAuthError) return e;
    console.error("stripe_checkout_error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Failed" }, { status: 500 });
  }
}
