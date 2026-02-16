-- CreateTable
CREATE TABLE "BatchJob" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "windowSize" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "BatchJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchTask" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jobId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "windowSize" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,

    CONSTRAINT "BatchTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BatchJob_createdAt_idx" ON "BatchJob"("createdAt");

-- CreateIndex
CREATE INDEX "BatchJob_status_idx" ON "BatchJob"("status");

-- CreateIndex
CREATE INDEX "BatchJob_scope_refId_idx" ON "BatchJob"("scope", "refId");

-- CreateIndex
CREATE INDEX "BatchTask_jobId_status_idx" ON "BatchTask"("jobId", "status");

-- CreateIndex
CREATE INDEX "BatchTask_agentId_idx" ON "BatchTask"("agentId");

-- AddForeignKey
ALTER TABLE "BatchTask" ADD CONSTRAINT "BatchTask_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BatchJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
