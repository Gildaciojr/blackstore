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

  private async refreshVariantProductInventory(tx: Prisma.TransactionClient, productIds: string[]) {
    for (const productId of new Set(productIds)) {
      const aggregate = await tx.productVariant.aggregate({
        where: { productId },
        _sum: {
          stock: true,
          reservedStock: true,
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          stock: aggregate._sum.stock ?? 0,
          reservedStock: aggregate._sum.reservedStock ?? 0,
        },
      });
    }
  }

  private async commitReservedStock(tx: Prisma.TransactionClient, orderId: string) {
    const items = await tx.orderItem.findMany({
      where: { orderId },
    });

    const variantProductIds = [
      ...new Set(items.filter((item) => item.variantId).map((item) => item.productId)),
    ].sort();

    /*
     * Serializa atualizações de produtos com variantes para que o agregado
     * Product.stock / Product.reservedStock permaneça consistente.
     */
    if (variantProductIds.length) {
      await tx.$queryRaw(
        Prisma.sql`SELECT "id"
          FROM "Product"
          WHERE "id" IN (${Prisma.join(variantProductIds)})
          ORDER BY "id"
          FOR UPDATE`,
      );
    }

    for (const item of items) {
      if (item.variantId) {
        /*
         * O pagamento foi confirmado.
         *
         * Agora ocorre a baixa física:
         * stock -= quantity
         *
         * E a reserva correspondente é consumida:
         * reservedStock -= quantity
         */
        const committed = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            productId: item.productId,
            stock: {
              gte: item.quantity,
            },
            reservedStock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
            reservedStock: {
              decrement: item.quantity,
            },
          },
        });

        if (committed.count !== 1) {
          throw new ConflictException(
            `Reserva de estoque inconsistente para a variante ${item.variantId}`,
          );
        }
      } else {
        const committed = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: {
              gte: item.quantity,
            },
            reservedStock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
            reservedStock: {
              decrement: item.quantity,
            },
          },
        });

        if (committed.count !== 1) {
          throw new ConflictException(
            `Reserva de estoque inconsistente para o produto ${item.productId}`,
          );
        }
      }
    }

    await this.refreshVariantProductInventory(tx, variantProductIds);
  }

  private async releaseReservedStock(tx: Prisma.TransactionClient, orderId: string) {
    const items = await tx.orderItem.findMany({
      where: { orderId },
    });

    const variantProductIds = [
      ...new Set(items.filter((item) => item.variantId).map((item) => item.productId)),
    ].sort();

    /*
     * Em falha/cancelamento não existe devolução de estoque físico,
     * pois o checkout nunca o diminuiu.
     *
     * Apenas liberamos reservedStock.
     */
    if (variantProductIds.length) {
      await tx.$queryRaw(
        Prisma.sql`SELECT "id"
          FROM "Product"
          WHERE "id" IN (${Prisma.join(variantProductIds)})
          ORDER BY "id"
          FOR UPDATE`,
      );
    }

    for (const item of items) {
      if (item.variantId) {
        const released = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            productId: item.productId,
            reservedStock: {
              gte: item.quantity,
            },
          },
          data: {
            reservedStock: {
              decrement: item.quantity,
            },
          },
        });

        if (released.count !== 1) {
          throw new ConflictException(
            `Reserva de estoque inconsistente para a variante ${item.variantId}`,
          );
        }
      } else {
        const released = await tx.product.updateMany({
          where: {
            id: item.productId,
            reservedStock: {
              gte: item.quantity,
            },
          },
          data: {
            reservedStock: {
              decrement: item.quantity,
            },
          },
        });

        if (released.count !== 1) {
          throw new ConflictException(
            `Reserva de estoque inconsistente para o produto ${item.productId}`,
          );
        }
      }
    }

    await this.refreshVariantProductInventory(tx, variantProductIds);
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

      if (!payment) {
        throw new ConflictException('Payment disappeared during lifecycle update');
      }

      if (incomingStatus === 'pending') {
        if (payment.status === 'paid' || payment.status === 'failed') {
          return payment;
        }

        if (reservationExpiresAt) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: { reservationExpiresAt },
          });
        }

        return tx.payment.update({
          where: { id: payment.id },
          data: {
            ...providerData,
            status: 'pending',
          },
        });
      }

      const targetReservationStatus =
        incomingStatus === 'paid' ? ReservationStatus.COMMITTED : ReservationStatus.RELEASED;

      const targetOrderStatus = incomingStatus === 'paid' ? 'paid' : 'canceled';

      /*
       * Claim atômico do lifecycle.
       *
       * Somente a transição RESERVED -> COMMITTED/RELEASED pode executar
       * os efeitos de estoque e cupom.
       */
      const claim = await tx.order.updateMany({
        where: {
          id: payment.orderId,
          reservationStatus: ReservationStatus.RESERVED,
        },
        data: {
          reservationStatus: targetReservationStatus,
          status: targetOrderStatus,
          ...(reservationExpiresAt ? { reservationExpiresAt } : {}),
        },
      });

      if (claim.count === 0) {
        const currentOrder = await tx.order.findUnique({
          where: { id: payment.orderId },
        });

        if (!currentOrder) {
          throw new ConflictException('Order disappeared during lifecycle update');
        }

        /*
         * Evento repetido para o mesmo estado final:
         * idempotência sem repetir baixa/liberação de estoque.
         */
        if (currentOrder.reservationStatus === targetReservationStatus) {
          return tx.payment.update({
            where: { id: payment.id },
            data: {
              ...providerData,
              status: incomingStatus,
            },
          });
        }

        /*
         * Um FAILED tardio nunca pode desfazer uma venda já confirmada.
         */
        if (
          incomingStatus === 'failed' &&
          currentOrder.reservationStatus === ReservationStatus.COMMITTED
        ) {
          return payment;
        }

        throw new ConflictException(
          `Cannot transition reservation from ${
            currentOrder.reservationStatus ?? 'UNCLASSIFIED'
          } to ${targetReservationStatus}`,
        );
      }

      if (incomingStatus === 'paid') {
        /*
         * Somente agora o estoque físico é efetivamente reduzido.
         */
        await this.commitReservedStock(tx, payment.orderId);

        if (payment.order.couponId) {
          const coupon = await tx.coupon.updateMany({
            where: {
              id: payment.order.couponId,
              reserved: {
                gt: 0,
              },
            },
            data: {
              reserved: {
                decrement: 1,
              },
              used: {
                increment: 1,
              },
            },
          });

          if (coupon.count !== 1) {
            throw new ConflictException('Coupon reservation is inconsistent');
          }
        }
      } else {
        /*
         * Falha/cancelamento:
         * estoque físico permanece intacto.
         * Apenas a reserva é liberada.
         */
        await this.releaseReservedStock(tx, payment.orderId);

        if (payment.order.couponId) {
          const coupon = await tx.coupon.updateMany({
            where: {
              id: payment.order.couponId,
              reserved: {
                gt: 0,
              },
            },
            data: {
              reserved: {
                decrement: 1,
              },
            },
          });

          if (coupon.count !== 1) {
            throw new ConflictException('Coupon reservation is inconsistent');
          }
        }
      }

      return tx.payment.update({
        where: { id: payment.id },
        data: {
          ...providerData,
          status: incomingStatus,
        },
      });
    });
  }
}
