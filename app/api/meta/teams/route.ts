import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = (searchParams.get("orgId") ?? "").trim();

    const teams = await prisma.team.findMany({
      where: orgId ? { organizationId: orgId } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        organizationId: true,
        createdAt: true,
        _count: { select: { agents: true } }, // важно: lowerCase имя relation-поля
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
