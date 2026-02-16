-- CreateTable
CREATE TABLE "AgentScoreHistory" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "windowSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentScoreHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentScoreHistory_agentId_createdAt_idx" ON "AgentScoreHistory"("agentId", "createdAt");
