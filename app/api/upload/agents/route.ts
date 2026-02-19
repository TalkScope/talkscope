import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { agents } = await req.json() as {
      agents: { name: string; email?: string; team?: string }[];
    };

    if (!agents?.length) {
      return NextResponse.json({ ok: false, error: "No agents provided" }, { status: 400 });
    }

    // Find or create a default org
    let org = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
    if (!org) {
      org = await prisma.organization.create({ data: { name: "Default Organization" } });
    }

    // Group agents by team name
    const teamMap = new Map<string, string>(); // teamName → teamId

    // Pre-load existing teams
    const existingTeams = await prisma.team.findMany({ where: { organizationId: org.id } });
    for (const t of existingTeams) teamMap.set(t.name.toLowerCase(), t.id);

    let created = 0;
    let skipped = 0;

    for (const agent of agents) {
      if (!agent.name?.trim()) continue;

      const teamName = agent.team?.trim() || "Default Team";
      const teamKey = teamName.toLowerCase();

      // Get or create team
      if (!teamMap.has(teamKey)) {
        const newTeam = await prisma.team.create({
          data: { name: teamName, organizationId: org.id },
        });
        teamMap.set(teamKey, newTeam.id);
      }

      const teamId = teamMap.get(teamKey)!;

      // Check if agent already exists
      const existing = await prisma.agent.findFirst({
        where: { name: agent.name.trim(), teamId },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.agent.create({
        data: {
          name: agent.name.trim(),
          email: agent.email?.trim() || null,
          teamId,
        },
      });

      created++;
    }

    return NextResponse.json({ ok: true, created, skipped });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Import failed" },
      { status: 500 }
    );
  }
}
