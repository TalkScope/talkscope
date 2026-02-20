import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: Request) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    // Verify agent belongs to this user
    const agent = await prisma.agent.findFirst({
      where: { id, team: { organization: { clerkUserId: userId } } },
      select: { id: true, name: true },
    });
    if (!agent) return NextResponse.json({ ok: false, error: "Agent not found or access denied" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.agentScoreHistory.deleteMany({ where: { agentId: id } });
      await tx.agentScore.deleteMany({ where: { agentId: id } });
      await tx.conversation.deleteMany({ where: { agentId: id } });
      await tx.patternReport.deleteMany({ where: { level: "agent", refId: id } });
      await tx.batchTask.deleteMany({ where: { agentId: id } });
      await tx.agent.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true, deleted: agent.name });
  } catch (e: any) {
    if (e?.isAuthError) return e;
    return NextResponse.json({ ok: false, error: e?.message || "Failed" }, { status: 500 });
  }
}
