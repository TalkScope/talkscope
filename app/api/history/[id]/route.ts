import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const item = await prisma.report.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      mode: true,
      summary: true,
      reportJson: true,
      transcriptChars: true,
    },
  });

  if (!item) return new NextResponse("Not found", { status: 404 });

  return NextResponse.json({
    ...item,
    report: JSON.parse(item.reportJson),
  });
}
