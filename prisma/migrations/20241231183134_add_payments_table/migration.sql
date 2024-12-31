-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "hublaPaymentId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerDocument" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "saleDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_hublaPaymentId_key" ON "payments"("hublaPaymentId");
