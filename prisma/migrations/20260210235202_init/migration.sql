-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode" TEXT NOT NULL,
    "transcriptChars" INTEGER NOT NULL,
    "transcriptHash" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "reportJson" TEXT NOT NULL,
    "ip" TEXT
);

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "Report_transcriptHash_idx" ON "Report"("transcriptHash");
