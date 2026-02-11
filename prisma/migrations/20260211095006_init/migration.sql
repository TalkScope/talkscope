-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode" TEXT NOT NULL,
    "transcriptChars" INTEGER NOT NULL,
    "transcriptHash" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "reportJson" TEXT NOT NULL,
    "ip" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "Report_transcriptHash_idx" ON "Report"("transcriptHash");
