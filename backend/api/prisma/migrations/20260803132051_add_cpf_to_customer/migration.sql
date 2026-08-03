-- CreateEnum
CREATE TYPE "ProductSize" AS ENUM ('PP', 'P', 'M', 'G', 'GG');

-- CreateEnum
CREATE TYPE "HomeSectionType" AS ENUM ('HERO', 'LAUNCHES', 'PROMOTIONS');

-- CreateEnum
CREATE TYPE "HeroSlideType" AS ENUM ('COLLECTION', 'PRODUCT', 'PROMO');

-- CreateEnum
CREATE TYPE "LookbookItemType" AS ENUM ('TOP', 'BOTTOM');

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "size" "ProductSize",
ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "cpf" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "couponCode" TEXT,
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "size" "ProductSize",
ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "cardExpMonth" TEXT,
ADD COLUMN     "cardExpYear" TEXT,
ADD COLUMN     "cardHolderName" TEXT,
ADD COLUMN     "installments" INTEGER;

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" "ProductSize" NOT NULL,
    "stock" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentLog" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeSectionItem" (
    "id" TEXT NOT NULL,
    "type" "HomeSectionType" NOT NULL,
    "position" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "heroSlideType" "HeroSlideType",
    "imageOverride" TEXT,
    "focus" TEXT,
    "focusDesktop" TEXT,
    "title1" TEXT,
    "title2" TEXT,
    "subtitle" TEXT,
    "cta1" TEXT,
    "cta2" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeSectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LookbookItem" (
    "id" TEXT NOT NULL,
    "type" "LookbookItemType" NOT NULL,
    "position" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT,
    "top" TEXT,
    "left" TEXT,
    "fabric" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LookbookItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_size_key" ON "ProductVariant"("productId", "size");

-- CreateIndex
CREATE INDEX "HomeSectionItem_type_idx" ON "HomeSectionItem"("type");

-- CreateIndex
CREATE UNIQUE INDEX "HomeSectionItem_type_position_key" ON "HomeSectionItem"("type", "position");

-- CreateIndex
CREATE UNIQUE INDEX "HomeSectionItem_type_productId_key" ON "HomeSectionItem"("type", "productId");

-- CreateIndex
CREATE INDEX "LookbookItem_type_idx" ON "LookbookItem"("type");

-- CreateIndex
CREATE UNIQUE INDEX "LookbookItem_type_position_key" ON "LookbookItem"("type", "position");

-- CreateIndex
CREATE UNIQUE INDEX "LookbookItem_type_productId_key" ON "LookbookItem"("type", "productId");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentLog" ADD CONSTRAINT "PaymentLog_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeSectionItem" ADD CONSTRAINT "HomeSectionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LookbookItem" ADD CONSTRAINT "LookbookItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
