import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Organizations with teams
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        name: true,
        createdAt: true,
        teams: {
          orderBy: { createdAt: "desc" },
          take: 500,
          select: { id: true, name: true, createdAt: true },
        },
      },
    });

    // Fallback: if you don't have org model yet, return teams only
    return NextResponse.json({
      ok: true,
      orgs: orgs.map((o) => ({
        id: o.id,
        name: o.name ?? null,
        createdAt: o.createdAt.toISOString(),
        teams: o.teams.map((t) => ({
          id: t.id,
          name: t.name ?? null,
          createdAt: t.createdAt.toISOString(),
        })),
      })),
    });
  } catch (e: any) {
    console.error("scope_list_error:", e);

    // If schema doesn't have organization/team relations, try a simpler fallback
    try {
      const teams = await prisma.team.findMany({
        orderBy: { createdAt: "desc" },
        take: 500,
        select: { id: true, name: true, createdAt: true, organizationId: true },
      });

      return NextResponse.json({
        ok: true,
        orgs: [],
        teams: teams.map((t) => ({
          id: t.id,
          name: t.name ?? null,
          organizationId: t.organizationId ?? null,
          createdAt: t.createdAt.toISOString(),
        })),
      });
    } catch (e2: any) {
      return NextResponse.json(
        { ok: false, error: e2?.message || e?.message || "Failed to list scopes" },
        { status: 500 }
      );
    }
  }
}
