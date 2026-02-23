import { NextResponse } from "next/server";
import { requireAuth, isWhitelisted } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    // Whitelist users get full access without Stripe
    if (isWhitelisted(userId)) {
      const org = await prisma.organization.findFirst({
        where: { clerkUserId: userId },
        select: { id: true, name: true },
      });
      return NextResponse.json({
        ok: true,
        hasOrg: !!org,
        orgId: org?.id ?? null,
        orgName: org?.name ?? "My Workspace",
        plan: "growth",
        status: "active",
        isActive: true,
        isPastDue: false,
        currentPeriodEnd: null,
        hasStripe: false,
        isWhitelisted: true,
      });
    }

    const org = await prisma.organization.findFirst({
      where: { clerkUserId: userId },
      select: {
        id: true,
        name: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            stripeCurrentPeriodEnd: true,
            stripeCustomerId: true,
          },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ ok: true, plan: "free", status: "inactive", hasOrg: false });
    }

    const sub = org.subscription;
    const isActive = sub?.status === "active";
    const isPastDue = sub?.status === "past_due";

    return NextResponse.json({
      ok: true,
      hasOrg: true,
      orgId: org.id,
      orgName: org.name,
      plan: sub?.plan ?? "free",
      status: sub?.status ?? "inactive",
      isActive,
      isPastDue,
      currentPeriodEnd: sub?.stripeCurrentPeriodEnd ?? null,
      hasStripe: !!sub?.stripeCustomerId,
      isWhitelisted: false,
    });
  } catch (e: any) {
    if (e?.isAuthError) return e;
    return NextResponse.json({ ok: false, error: e?.message || "Failed" }, { status: 500 });
  }
}
