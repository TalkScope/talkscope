import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get("orgId")?.trim() || "";
    if (!orgId) {
      return NextResponse.json({ ok: true, teams: [] });
    }

    const teams = await prisma.team.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        organizationId: true,
        createdAt: true,
        _count: { select: { agents: true } },
      },
    });

    return NextResponse.json({ ok: true, teams });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to load teams" },
      { status: 500 }
    );
  }
}
