import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const scope = String(url.searchParams.get("scope") ?? "team");
    const refId = String(url.searchParams.get("refId") ?? "").trim();
    const take = Number(url.searchParams.get("take") ?? 200);

    if (!["team", "org"].includes(scope)) return new NextResponse("Invalid scope", { status: 400 });
    if (!refId) return new NextResponse("Missing refId", { status: 400 });

    const agents = await prisma.agent.findMany({
      where: scope === "team" ? { teamId: refId } : { team: { organizationId: refId } },
      orderBy: { createdAt: "desc" },
      take: Number.isFinite(take) ? Math.min(Math.max(take, 10), 2000) : 200,
      select: { id: true, name: true, createdAt: true, teamId: true },
    });

    return NextResponse.json({
      ok: true,
      count: agents.length,
      agents: agents.map((a) => ({
        id: a.id,
        name: (a as any).name ?? null,
        teamId: a.teamId ?? null,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (e: any) {
    console.error("scope_agents_error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Failed to list agents" }, { status: 500 });
  }
}
