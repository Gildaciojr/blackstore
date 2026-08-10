import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, ReservationStatus, type Payment } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PagbankPaymentStatus } from '../payment/providers/pagbank.provider';

type ProviderPaymentData = Pick<
  Prisma.PaymentUncheckedUpdateInput,
  'providerRef' | 'providerId' | 'qrCode' | 'qrCodeText' | 'cardLast4' | 'cardBrand'
>;

@Injectable()
export class OrderLifecycleService {
  constructor(private readonly prisma: PrismaService) {}

  private async refreshVariantProductStock(tx: Prisma.TransactionClient, productIds: string[]) {
    for (const productId of new Set(productIds)) {
      const aggregate = await tx.productVariant.aggregate({
        where: { productId },
        _sum: { stock: true },
      });
      await tx.product.update({
        where: { id: productId },
        data: { stock: aggregate._sum.stock ?? 0 },
      });
    }
  }

  private async releaseStock(tx: Prisma.TransactionClient, orderId: string) {
    const items = await tx.orderItem.findMany({ where: { orderId } });
    const variantProductIds = [
      ...new Set(items.filter((item) => item.variantId).map((item) => item.productId)),
    ].sort();

    if (variantProductIds.length) {
      await tx.$queryRaw(
        Prisma.sql`SELECT "id" FROM "Product"
          WHERE "id" IN (${Prisma.join(variantProductIds)})
          ORDER BY "id" FOR UPDATE`,
      );
    }

    for (const item of items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    await this.refreshVariantProductStock(tx, variantProductIds);
  }

  async applyPaymentStatus(
    paymentId: string,
    incomingStatus: PagbankPaymentStatus,
    providerData: ProviderPaymentData = {},
    reservationExpiresAt?: Date | null,
  ): Promise<Payment> {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
      });
      if (!payment) throw new ConflictException('Payment disappeared during lifecycle update');

      if (incomingStatus === 'pending') {
        if (payment.status === 'paid' || payment.status === 'failed') return payment;
        if (reservationExpiresAt) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: { reservationExpiresAt },
          });
        }
        return tx.payment.update({
          where: { id: payment.id },
          data: { ...providerData, status: 'pending' },
        });
      }

      const targetReservationStatus =
        incomingStatus === 'paid' ? ReservationStatus.COMMITTED : ReservationStatus.RELEASED;
      const targetOrderStatus = incomingStatus === 'paid' ? 'paid' : 'canceled';
      const claim = await tx.order.updateMany({
        where: { id: payment.orderId, reservationStatus: ReservationStatus.RESERVED },
        data: {
          reservationStatus: targetReservationStatus,
          status: targetOrderStatus,
          ...(reservationExpiresAt ? { reservationExpiresAt } : {}),
        },
      });

      if (claim.count === 0) {
        const currentOrder = await tx.order.findUnique({ where: { id: payment.orderId } });
        if (!currentOrder) throw new ConflictException('Order disappeared during lifecycle update');

        if (currentOrder.reservationStatus === targetReservationStatus) {
          return tx.payment.update({
            where: { id: payment.id },
            data: { ...providerData, status: incomingStatus },
          });
        }

        if (
          incomingStatus === 'failed' &&
          currentOrder.reservationStatus === ReservationStatus.COMMITTED
        ) {
          return payment;
        }

        throw new ConflictException(
          `Cannot transition reservation from ${currentOrder.reservationStatus ?? 'UNCLASSIFIED'} to ${targetReservationStatus}`,
        );
      }

      if (incomingStatus === 'paid') {
        if (payment.order.couponId) {
          const coupon = await tx.coupon.updateMany({
            where: { id: payment.order.couponId, reserved: { gt: 0 } },
            data: { reserved: { decrement: 1 }, used: { increment: 1 } },
          });
          if (coupon.count !== 1) {
            throw new ConflictException('Coupon reservation is inconsistent');
          }
        }
      } else {
        await this.releaseStock(tx, payment.orderId);
        if (payment.order.couponId) {
          const coupon = await tx.coupon.updateMany({
            where: { id: payment.order.couponId, reserved: { gt: 0 } },
            data: { reserved: { decrement: 1 } },
          });
          if (coupon.count !== 1) {
            throw new ConflictException('Coupon reservation is inconsistent');
          }
        }
      }

      return tx.payment.update({
        where: { id: payment.id },
        data: { ...providerData, status: incomingStatus },
      });
    });
  }
}
