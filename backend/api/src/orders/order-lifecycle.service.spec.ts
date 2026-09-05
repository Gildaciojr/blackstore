import { describe, expect, it, jest } from '@jest/globals';
import { ConflictException } from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { OrderLifecycleService } from './order-lifecycle.service';

type PaymentUpdateArgs = {
  data: {
    status?: string;
    providerRef?: string | null;
    providerId?: string | null;
    qrCode?: string | null;
    qrCodeText?: string | null;
    cardLast4?: string | null;
    cardBrand?: string | null;
  };
};

type OrderUpdateManyArgs = {
  where: {
    reservationStatus?: ReservationStatus | null;
  };
  data: {
    reservationStatus?: ReservationStatus;
    status?: string;
    reservationExpiresAt?: Date | null;
  };
};

type OrderUpdateArgs = {
  where: {
    id: string;
  };
  data: {
    reservationExpiresAt?: Date | null;
  };
};

type CouponUpdateManyArgs = {
  where: {
    reserved?: {
      gt?: number;
    };
  };
  data: {
    reserved?: {
      decrement?: number;
    };
    used?: {
      increment?: number;
    };
  };
};

type InventoryUpdateManyArgs = {
  where: {
    stock?: {
      gte?: number;
    };
    reservedStock?: {
      gte?: number;
    };
  };
  data: {
    stock?: {
      decrement?: number;
    };
    reservedStock?: {
      decrement?: number;
    };
  };
};

type ProductUpdateArgs = {
  where: {
    id: string;
  };
  data: {
    stock?: number;
    reservedStock?: number;
  };
};

type VariantAggregateArgs = {
  where: {
    productId: string;
  };
  _sum: {
    stock: boolean;
    reservedStock: boolean;
  };
};

describe('OrderLifecycleService Phase C', () => {
  function harness(options?: { variant?: boolean; coupon?: boolean }) {
    const order: {
      id: string;
      customerId: string;
      couponId: string | null;
      reservationStatus: ReservationStatus;
      status: string;
      reservationExpiresAt?: Date | null;
    } = {
      id: 'order-1',
      customerId: 'customer-1',
      couponId: options?.coupon ? 'coupon-1' : null,
      reservationStatus: ReservationStatus.RESERVED,
      status: 'pending',
    };

    const payment = {
      id: 'payment-1',
      orderId: order.id,
      method: 'pix',
      status: 'pending',
      amount: 100,
      provider: 'pagbank',
      providerId: null as string | null,
      providerRef: null as string | null,
      qrCode: null as string | null,
      qrCodeText: null as string | null,
      cardLast4: null as string | null,
      cardBrand: null as string | null,
      cardHolderName: null as string | null,
      installments: null as number | null,
      cardExpMonth: null as string | null,
      cardExpYear: null as string | null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const coupon = {
      reserved: options?.coupon ? 1 : 0,
      used: 0,
    };

    /*
     * O checkout já reservou a unidade.
     *
     * O estoque físico continua existindo.
     * Apenas reservedStock está comprometido.
     */
    const product = {
      stock: 1,
      reservedStock: 1,
    };

    const variant = {
      stock: 1,
      reservedStock: 1,
    };

    const items = [
      {
        id: 'item-1',
        orderId: order.id,
        productId: 'product-1',
        variantId: options?.variant ? 'variant-1' : null,
        size: options?.variant ? 'M' : null,
        quantity: 1,
        price: 100,
      },
    ];

    const tx = {
      $queryRaw: jest.fn(async () => []),

      payment: {
        findUnique: jest.fn(async () => ({
          ...payment,
          order,
        })),

        update: jest.fn(async ({ data }: PaymentUpdateArgs) => {
          if (data.status !== undefined) {
            payment.status = data.status;
          }

          if (data.providerRef !== undefined) {
            payment.providerRef = data.providerRef;
          }

          if (data.providerId !== undefined) {
            payment.providerId = data.providerId;
          }

          if (data.qrCode !== undefined) {
            payment.qrCode = data.qrCode;
          }

          if (data.qrCodeText !== undefined) {
            payment.qrCodeText = data.qrCodeText;
          }

          if (data.cardLast4 !== undefined) {
            payment.cardLast4 = data.cardLast4;
          }

          if (data.cardBrand !== undefined) {
            payment.cardBrand = data.cardBrand;
          }

          payment.updatedAt = new Date();

          return {
            ...payment,
          };
        }),
      },

      order: {
        updateMany: jest.fn(async ({ where, data }: OrderUpdateManyArgs) => {
          if (
            where.reservationStatus !== undefined &&
            order.reservationStatus !== where.reservationStatus
          ) {
            return {
              count: 0,
            };
          }

          if (data.reservationStatus !== undefined) {
            order.reservationStatus = data.reservationStatus;
          }

          if (data.status !== undefined) {
            order.status = data.status;
          }

          if (data.reservationExpiresAt !== undefined) {
            order.reservationExpiresAt = data.reservationExpiresAt;
          }

          return {
            count: 1,
          };
        }),

        findUnique: jest.fn(async () => ({
          ...order,
        })),

        update: jest.fn(async ({ data }: OrderUpdateArgs) => {
          if (data.reservationExpiresAt !== undefined) {
            order.reservationExpiresAt = data.reservationExpiresAt;
          }

          return {
            ...order,
          };
        }),
      },

      orderItem: {
        findMany: jest.fn(async () => items),
      },

      coupon: {
        updateMany: jest.fn(async ({ where, data }: CouponUpdateManyArgs) => {
          if (where.reserved?.gt !== undefined && coupon.reserved <= where.reserved.gt) {
            return {
              count: 0,
            };
          }

          if (data.reserved?.decrement !== undefined) {
            coupon.reserved -= data.reserved.decrement;
          }

          if (data.used?.increment !== undefined) {
            coupon.used += data.used.increment;
          }

          return {
            count: 1,
          };
        }),
      },

      product: {
        updateMany: jest.fn(async ({ where, data }: InventoryUpdateManyArgs) => {
          if (where.stock?.gte !== undefined && product.stock < where.stock.gte) {
            return {
              count: 0,
            };
          }

          if (
            where.reservedStock?.gte !== undefined &&
            product.reservedStock < where.reservedStock.gte
          ) {
            return {
              count: 0,
            };
          }

          if (data.stock?.decrement !== undefined) {
            product.stock -= data.stock.decrement;
          }

          if (data.reservedStock?.decrement !== undefined) {
            product.reservedStock -= data.reservedStock.decrement;
          }

          return {
            count: 1,
          };
        }),

        update: jest.fn(async ({ data }: ProductUpdateArgs) => {
          if (data.stock !== undefined) {
            product.stock = data.stock;
          }

          if (data.reservedStock !== undefined) {
            product.reservedStock = data.reservedStock;
          }

          return {
            id: 'product-1',
            ...product,
          };
        }),
      },

      productVariant: {
        updateMany: jest.fn(async ({ where, data }: InventoryUpdateManyArgs) => {
          if (where.stock?.gte !== undefined && variant.stock < where.stock.gte) {
            return {
              count: 0,
            };
          }

          if (
            where.reservedStock?.gte !== undefined &&
            variant.reservedStock < where.reservedStock.gte
          ) {
            return {
              count: 0,
            };
          }

          if (data.stock?.decrement !== undefined) {
            variant.stock -= data.stock.decrement;
          }

          if (data.reservedStock?.decrement !== undefined) {
            variant.reservedStock -= data.reservedStock.decrement;
          }

          return {
            count: 1,
          };
        }),

        aggregate: jest.fn(async (args: VariantAggregateArgs) => {
          void args;

          return {
            _sum: {
              stock: variant.stock,
              reservedStock: variant.reservedStock,
            },
          };
        }),
      },
    };

    const prisma = {
      $transaction: async <T>(callback: (transaction: typeof tx) => Promise<T>): Promise<T> =>
        callback(tx),
    };

    const service = new OrderLifecycleService(prisma as unknown as PrismaService);

    return {
      service,
      order,
      payment,
      coupon,
      product,
      variant,
      tx,
    };
  }

  it.each([2, 5, 20])('commits PAID exactly once across %i repetitions', async (repetitions) => {
    const state = harness({
      coupon: true,
    });

    await Promise.all(
      Array.from({ length: repetitions }, () =>
        state.service.applyPaymentStatus('payment-1', 'paid'),
      ),
    );

    expect(state.order.reservationStatus).toBe(ReservationStatus.COMMITTED);
    expect(state.order.status).toBe('paid');
    expect(state.payment.status).toBe('paid');

    expect(state.product).toEqual({
      stock: 0,
      reservedStock: 0,
    });

    expect(state.coupon).toEqual({
      reserved: 0,
      used: 1,
    });

    expect(state.tx.product.updateMany).toHaveBeenCalledTimes(1);
    expect(state.tx.coupon.updateMany).toHaveBeenCalledTimes(1);
    expect(state.tx.orderItem.findMany).toHaveBeenCalledTimes(1);
  });

  it.each([2, 5, 20])(
    'releases FAILED exactly once across %i repetitions without changing physical stock',
    async (repetitions) => {
      const state = harness({
        coupon: true,
      });

      await Promise.all(
        Array.from({ length: repetitions }, () =>
          state.service.applyPaymentStatus('payment-1', 'failed'),
        ),
      );

      expect(state.order.reservationStatus).toBe(ReservationStatus.RELEASED);
      expect(state.order.status).toBe('canceled');
      expect(state.payment.status).toBe('failed');

      expect(state.product).toEqual({
        stock: 1,
        reservedStock: 0,
      });

      expect(state.coupon).toEqual({
        reserved: 0,
        used: 0,
      });

      expect(state.tx.product.updateMany).toHaveBeenCalledTimes(1);
      expect(state.tx.coupon.updateMany).toHaveBeenCalledTimes(1);
      expect(state.tx.orderItem.findMany).toHaveBeenCalledTimes(1);
    },
  );

  it('commits variant physical stock and consumes variant reservation only after PAID', async () => {
    const state = harness({
      variant: true,
    });

    await state.service.applyPaymentStatus('payment-1', 'paid');

    expect(state.variant).toEqual({
      stock: 0,
      reservedStock: 0,
    });

    expect(state.product).toEqual({
      stock: 0,
      reservedStock: 0,
    });

    expect(state.tx.productVariant.updateMany).toHaveBeenCalledTimes(1);

    expect(state.tx.productVariant.aggregate).toHaveBeenCalledWith({
      where: {
        productId: 'product-1',
      },
      _sum: {
        stock: true,
        reservedStock: true,
      },
    });

    expect(state.tx.product.update).toHaveBeenCalledWith({
      where: {
        id: 'product-1',
      },
      data: {
        stock: 0,
        reservedStock: 0,
      },
    });
  });

  it('releases variant reservation without restoring or changing physical stock', async () => {
    const state = harness({
      variant: true,
    });

    await state.service.applyPaymentStatus('payment-1', 'failed');

    expect(state.variant).toEqual({
      stock: 1,
      reservedStock: 0,
    });

    expect(state.product).toEqual({
      stock: 1,
      reservedStock: 0,
    });

    expect(state.tx.productVariant.aggregate).toHaveBeenCalledWith({
      where: {
        productId: 'product-1',
      },
      _sum: {
        stock: true,
        reservedStock: true,
      },
    });
  });

  it('persists authoritative PIX expiration without committing physical stock', async () => {
    const state = harness();

    const expiration = new Date('2026-08-10T18:00:00.000Z');

    await state.service.applyPaymentStatus('payment-1', 'pending', {}, expiration);

    expect(state.order.reservationStatus).toBe(ReservationStatus.RESERVED);
    expect(state.order.status).toBe('pending');

    expect(state.product).toEqual({
      stock: 1,
      reservedStock: 1,
    });

    expect(state.tx.product.updateMany).not.toHaveBeenCalled();
    expect(state.tx.productVariant.updateMany).not.toHaveBeenCalled();
    expect(state.tx.orderItem.findMany).not.toHaveBeenCalled();

    expect(state.tx.order.update).toHaveBeenCalledWith({
      where: {
        id: 'order-1',
      },
      data: {
        reservationExpiresAt: expiration,
      },
    });
  });

  it('does not release or restore stock after PAID when DECLINED/CANCELED arrives late', async () => {
    const state = harness({
      coupon: true,
    });

    await state.service.applyPaymentStatus('payment-1', 'paid');
    await state.service.applyPaymentStatus('payment-1', 'failed');

    expect(state.order.reservationStatus).toBe(ReservationStatus.COMMITTED);
    expect(state.payment.status).toBe('paid');

    expect(state.product).toEqual({
      stock: 0,
      reservedStock: 0,
    });

    expect(state.coupon).toEqual({
      reserved: 0,
      used: 1,
    });

    expect(state.tx.product.updateMany).toHaveBeenCalledTimes(1);
    expect(state.tx.coupon.updateMany).toHaveBeenCalledTimes(1);
  });

  it('rejects PAID after a reservation was released', async () => {
    const state = harness();

    await state.service.applyPaymentStatus('payment-1', 'failed');

    expect(state.product).toEqual({
      stock: 1,
      reservedStock: 0,
    });

    await expect(state.service.applyPaymentStatus('payment-1', 'paid')).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(state.product).toEqual({
      stock: 1,
      reservedStock: 0,
    });
  });
});
