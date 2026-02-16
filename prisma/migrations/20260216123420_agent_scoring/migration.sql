-- CreateTable
CREATE TABLE "AgentScore" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "windowSize" INTEGER NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "communicationScore" DOUBLE PRECISION NOT NULL,
    "conversionScore" DOUBLE PRECISION NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "coachingPriority" DOUBLE PRECISION NOT NULL,
    "strengths" TEXT NOT NULL,
    "weaknesses" TEXT NOT NULL,
    "keyPatterns" TEXT NOT NULL,

    CONSTRAINT "AgentScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentScore_agentId_createdAt_idx" ON "AgentScore"("agentId", "createdAt");
