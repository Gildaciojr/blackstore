-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('RESERVED', 'COMMITTED', 'RELEASED');

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN     "checkoutKey" UUID,
ADD COLUMN     "reservationStatus" "ReservationStatus",
ADD COLUMN     "reservationExpiresAt" TIMESTAMP(3),
ADD COLUMN     "couponId" TEXT;

-- AlterTable
ALTER TABLE "Coupon"
ADD COLUMN     "reserved" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Order_checkoutKey_key" ON "Order"("checkoutKey");

-- CreateIndex
CREATE INDEX "Order_reservationStatus_reservationExpiresAt_idx"
ON "Order"("reservationStatus", "reservationExpiresAt");

-- CreateIndex
CREATE INDEX "Order_couponId_idx" ON "Order"("couponId");

-- AddForeignKey
ALTER TABLE "Order"
ADD CONSTRAINT "Order_couponId_fkey"
FOREIGN KEY ("couponId") REFERENCES "Coupon"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
