import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
  const { userId } = await requireAuth();

  const url = new URL(req.url);
  const level = (url.searchParams.get("level") || "").trim(); // agent|team|org optional
  const refId = (url.searchParams.get("refId") || "").trim(); // optional
  const take = Math.min(Number(url.searchParams.get("take") || 20), 50);

  const where: any = {};
  if (level) where.level = level;
  if (refId) where.refId = refId;

  const rows = await prisma.patternReport.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      level: true,
      refId: true,
      windowSize: true,
      createdAt: true,
      reportJson: true,
    },
  });

  return NextResponse.json(rows);
  } catch(e: any) {
    if (e?.isAuthError) return e;
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
