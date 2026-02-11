import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      createdAt: true,
      mode: true,
      summary: true,
      transcriptChars: true,
    },
  });

  return NextResponse.json(items);
}
