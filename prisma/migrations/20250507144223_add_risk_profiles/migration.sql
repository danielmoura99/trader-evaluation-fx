-- CreateTable
CREATE TABLE "risk_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nelogicaProfileId" TEXT NOT NULL,
    "initialBalance" DOUBLE PRECISION NOT NULL,
    "trailing" BOOLEAN NOT NULL,
    "stopOutRule" DOUBLE PRECISION NOT NULL,
    "leverage" INTEGER NOT NULL,
    "commissionsEnabled" BOOLEAN NOT NULL,
    "enableContractExposure" BOOLEAN NOT NULL,
    "contractExposure" INTEGER NOT NULL,
    "enableLoss" BOOLEAN NOT NULL,
    "lossRule" DOUBLE PRECISION NOT NULL,
    "enableGain" BOOLEAN NOT NULL,
    "gainRule" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_risk_mappings" (
    "id" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "riskProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_risk_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "risk_profiles_nelogicaProfileId_key" ON "risk_profiles"("nelogicaProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "plan_risk_mappings_planName_riskProfileId_key" ON "plan_risk_mappings"("planName", "riskProfileId");

-- AddForeignKey
ALTER TABLE "plan_risk_mappings" ADD CONSTRAINT "plan_risk_mappings_riskProfileId_fkey" FOREIGN KEY ("riskProfileId") REFERENCES "risk_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
