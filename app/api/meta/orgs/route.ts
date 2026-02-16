import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { Teams: true } },
      },
    });

    return NextResponse.json({ ok: true, orgs });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to load orgs" },
      { status: 500 }
    );
  }
}
