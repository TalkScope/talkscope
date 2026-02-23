import { NextRequest, NextResponse } from "next/server";
import { stripe, getPlanByPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e: any) {
    console.error("Stripe webhook signature failed:", e.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── Subscription created or updated ──────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const priceId = sub.items.data[0]?.price.id ?? "";
        const plan = getPlanByPriceId(priceId);
        const periodEnd = new Date(sub.current_period_end * 1000);
        const status = sub.status === "active" ? "active"
          : sub.status === "past_due" ? "past_due"
          : sub.status === "canceled" ? "canceled"
          : "inactive";

        await prisma.subscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId: sub.id,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: periodEnd,
            plan,
            status,
          },
        });

        console.log(`Subscription ${event.type}: customer=${customerId} plan=${plan} status=${status}`);
        break;
      }

      // ── Subscription deleted (canceled) ──────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        await prisma.subscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            plan: "free",
            status: "canceled",
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
          },
        });

        console.log(`Subscription canceled: customer=${customerId}`);
        break;
      }

      // ── Checkout completed ────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.CheckoutSession;
        const customerId = session.customer as string;
        const subId = session.subscription as string;

        if (subId) {
          const stripeSub = await stripe.subscriptions.retrieve(subId);
          const priceId = stripeSub.items.data[0]?.price.id ?? "";
          const plan = getPlanByPriceId(priceId);
          const periodEnd = new Date(stripeSub.current_period_end * 1000);

          await prisma.subscription.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              stripeSubscriptionId: subId,
              stripePriceId: priceId,
              stripeCurrentPeriodEnd: periodEnd,
              plan,
              status: "active",
            },
          });

          console.log(`Checkout completed: customer=${customerId} plan=${plan}`);
        }
        break;
      }

      // ── Payment failed ────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await prisma.subscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: { status: "past_due" },
        });

        console.log(`Payment failed: customer=${customerId}`);
        break;
      }

      default:
        break;
    }
  } catch (e: any) {
    console.error("Stripe webhook handler error:", e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
