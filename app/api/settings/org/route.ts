import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/settings/org — create or rename org
export async function POST(req: Request) {
  try {
    const { id, name } = await req.json() as { id?: string; name: string };
    if (!name?.trim()) return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });

    if (id) {
      // rename
      const org = await prisma.organization.update({ where: { id }, data: { name: name.trim() } });
      return NextResponse.json({ ok: true, org });
    } else {
      // create
      const org = await prisma.organization.create({ data: { name: name.trim() } });
      return NextResponse.json({ ok: true, org });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed" }, { status: 500 });
  }
}

// DELETE /api/settings/org?id=xxx — delete org (cascades)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    // Delete in order to avoid FK issues
    await prisma.$transaction(async (tx) => {
      // Get all agents in this org
      const teams = await tx.team.findMany({ where: { organizationId: id }, select: { id: true } });
      const teamIds = teams.map(t => t.id);
      const agents = await tx.agent.findMany({ where: { teamId: { in: teamIds } }, select: { id: true } });
      const agentIds = agents.map(a => a.id);

      await tx.agentScoreHistory.deleteMany({ where: { agentId: { in: agentIds } } });
      await tx.agentScore.deleteMany({ where: { agentId: { in: agentIds } } });
      await tx.conversation.deleteMany({ where: { agentId: { in: agentIds } } });
      await tx.agent.deleteMany({ where: { id: { in: agentIds } } });
      await tx.patternReport.deleteMany({ where: { organizationId: id } });
      await tx.patternReport.deleteMany({ where: { teamId: { in: teamIds } } });
      await tx.team.deleteMany({ where: { organizationId: id } });
      await tx.organization.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed" }, { status: 500 });
  }
}
