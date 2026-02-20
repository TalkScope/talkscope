import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST — create or rename team
export async function POST(req: Request) {
  try {
    const { id, name, organizationId } = await req.json() as { id?: string; name: string; organizationId?: string };
    if (!name?.trim()) return NextResponse.json({ ok: false, error: "Name required" }, { status: 400 });

    if (id) {
      const team = await prisma.team.update({ where: { id }, data: { name: name.trim() } });
      return NextResponse.json({ ok: true, team });
    } else {
      if (!organizationId) return NextResponse.json({ ok: false, error: "organizationId required" }, { status: 400 });
      const team = await prisma.team.create({ data: { name: name.trim(), organizationId } });
      return NextResponse.json({ ok: true, team });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed" }, { status: 500 });
  }
}

// DELETE — delete team + cascade
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    await prisma.$transaction(async (tx) => {
      const agents = await tx.agent.findMany({ where: { teamId: id }, select: { id: true } });
      const agentIds = agents.map(a => a.id);
      await tx.agentScoreHistory.deleteMany({ where: { agentId: { in: agentIds } } });
      await tx.agentScore.deleteMany({ where: { agentId: { in: agentIds } } });
      await tx.conversation.deleteMany({ where: { agentId: { in: agentIds } } });
      await tx.agent.deleteMany({ where: { id: { in: agentIds } } });
      await tx.patternReport.deleteMany({ where: { teamId: id } });
      await tx.team.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed" }, { status: 500 });
  }
}
