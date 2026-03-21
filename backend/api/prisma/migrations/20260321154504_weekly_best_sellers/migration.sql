-- CreateTable
CREATE TABLE "WeeklyBestSeller" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyBestSeller_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyBestSeller_productId_key" ON "WeeklyBestSeller"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyBestSeller_position_key" ON "WeeklyBestSeller"("position");

-- AddForeignKey
ALTER TABLE "WeeklyBestSeller" ADD CONSTRAINT "WeeklyBestSeller_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
