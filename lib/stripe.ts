import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});

export const PLANS = {
  starter: {
    name: "Starter",
    priceId: process.env.STRIPE_PRICE_STARTER!,
    amount: 4900, // $49
  },
  growth: {
    name: "Growth",
    priceId: process.env.STRIPE_PRICE_GROWTH!,
    amount: 19900, // $199
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanByPriceId(priceId: string): PlanKey | "free" {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) return key as PlanKey;
  }
  return "free";
}
