import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();
    const { agents } = await req.json() as {
      agents: { name: string; email?: string; team?: string }[];
    };

    if (!agents?.length) return NextResponse.json({ ok: false, error: "No agents provided" }, { status: 400 });

    // Find or create org for this user
    let org = await prisma.organization.findFirst({
      where: { clerkUserId: userId },
      orderBy: { createdAt: "asc" },
    });
    if (!org) {
      org = await prisma.organization.create({ data: { name: "My Organization", clerkUserId: userId } });
    }

    const teamMap = new Map<string, string>();
    const existingTeams = await prisma.team.findMany({ where: { organizationId: org.id } });
    for (const t of existingTeams) teamMap.set(t.name.toLowerCase(), t.id);

    let created = 0, skipped = 0;

    for (const agent of agents) {
      if (!agent.name?.trim()) continue;
      const teamName = agent.team?.trim() || "Default Team";
      const teamKey = teamName.toLowerCase();

      if (!teamMap.has(teamKey)) {
        const newTeam = await prisma.team.create({ data: { name: teamName, organizationId: org.id } });
        teamMap.set(teamKey, newTeam.id);
      }

      const teamId = teamMap.get(teamKey)!;
      const existing = await prisma.agent.findFirst({ where: { name: agent.name.trim(), teamId } });
      if (existing) { skipped++; continue; }

      await prisma.agent.create({ data: { name: agent.name.trim(), email: agent.email?.trim() || null, teamId } });
      created++;
    }

    return NextResponse.json({ ok: true, created, skipped });
  } catch (e: any) {
    if (e?.isAuthError) return e;
    return NextResponse.json({ ok: false, error: e?.message || "Import failed" }, { status: 500 });
  }
}
