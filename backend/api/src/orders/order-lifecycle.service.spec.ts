import { ConflictException } from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { OrderLifecycleService } from './order-lifecycle.service';

describe('OrderLifecycleService Phase C', () => {
  function harness(options?: { variant?: boolean; coupon?: boolean }) {
    const order = {
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
      providerId: null,
      providerRef: null,
      qrCode: null,
      qrCodeText: null,
      cardLast4: null,
      cardBrand: null,
      cardHolderName: null,
      installments: null,
      cardExpMonth: null,
      cardExpYear: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const coupon = { reserved: options?.coupon ? 1 : 0, used: 0 };
    const product = { stock: options?.variant ? 0 : 0 };
    const variant = { stock: options?.variant ? 0 : 0 };
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
      $queryRaw: jest.fn().mockResolvedValue([]),
      payment: {
        findUnique: jest.fn().mockImplementation(() => Promise.resolve({ ...payment, order })),
        update: jest.fn().mockImplementation(({ data }) => {
          Object.assign(payment, data, { updatedAt: new Date() });
          return Promise.resolve({ ...payment });
        }),
      },
      order: {
        updateMany: jest.fn().mockImplementation(({ where, data }) => {
          if (order.reservationStatus !== where.reservationStatus)
            return Promise.resolve({ count: 0 });
          Object.assign(order, data);
          return Promise.resolve({ count: 1 });
        }),
        findUnique: jest.fn().mockImplementation(() => Promise.resolve({ ...order })),
        update: jest.fn().mockImplementation(({ data }) => {
          Object.assign(order, data);
          return Promise.resolve({ ...order });
        }),
      },
      orderItem: { findMany: jest.fn().mockResolvedValue(items) },
      coupon: {
        updateMany: jest.fn().mockImplementation(({ where, data }) => {
          if (where.reserved?.gt === 0 && coupon.reserved <= 0)
            return Promise.resolve({ count: 0 });
          if (data.reserved?.decrement) coupon.reserved -= data.reserved.decrement;
          if (data.used?.increment) coupon.used += data.used.increment;
          return Promise.resolve({ count: 1 });
        }),
      },
      product: {
        update: jest.fn().mockImplementation(({ data }) => {
          if (data.stock?.increment) product.stock += data.stock.increment;
          if (typeof data.stock === 'number') product.stock = data.stock;
          return Promise.resolve({ id: 'product-1', ...product });
        }),
      },
      productVariant: {
        update: jest.fn().mockImplementation(({ data }) => {
          variant.stock += data.stock.increment;
          return Promise.resolve({ id: 'variant-1', productId: 'product-1', ...variant });
        }),
        aggregate: jest
          .fn()
          .mockImplementation(() => Promise.resolve({ _sum: { stock: variant.stock } })),
      },
    };
    const prisma = {
      $transaction: jest.fn().mockImplementation((callback) => callback(tx)),
    };
    const service = new OrderLifecycleService(prisma as unknown as PrismaService);
    return { service, order, payment, coupon, product, variant, tx };
  }

  it.each([2, 5, 20])('commits PAID exactly once across %i repetitions', async (repetitions) => {
    const state = harness({ coupon: true });
    await Promise.all(
      Array.from({ length: repetitions }, () =>
        state.service.applyPaymentStatus('payment-1', 'paid'),
      ),
    );

    expect(state.order.reservationStatus).toBe(ReservationStatus.COMMITTED);
    expect(state.order.status).toBe('paid');
    expect(state.payment.status).toBe('paid');
    expect(state.coupon).toEqual({ reserved: 0, used: 1 });
    expect(state.tx.coupon.updateMany).toHaveBeenCalledTimes(1);
  });

  it.each([2, 5, 20])('releases FAILED exactly once across %i repetitions', async (repetitions) => {
    const state = harness({ coupon: true });
    await Promise.all(
      Array.from({ length: repetitions }, () =>
        state.service.applyPaymentStatus('payment-1', 'failed'),
      ),
    );

    expect(state.order.reservationStatus).toBe(ReservationStatus.RELEASED);
    expect(state.order.status).toBe('canceled');
    expect(state.product.stock).toBe(1);
    expect(state.coupon).toEqual({ reserved: 0, used: 0 });
    expect(state.tx.orderItem.findMany).toHaveBeenCalledTimes(1);
  });

  it('restores variant stock and recalculates materialized Product.stock from OrderItems', async () => {
    const state = harness({ variant: true });
    await state.service.applyPaymentStatus('payment-1', 'failed');

    expect(state.variant.stock).toBe(1);
    expect(state.product.stock).toBe(1);
    expect(state.tx.productVariant.aggregate).toHaveBeenCalledWith({
      where: { productId: 'product-1' },
      _sum: { stock: true },
    });
  });

  it('persists authoritative PIX expiration without committing the reservation', async () => {
    const state = harness();
    const expiration = new Date('2026-08-10T18:00:00.000Z');
    await state.service.applyPaymentStatus('payment-1', 'pending', {}, expiration);

    expect(state.order.reservationStatus).toBe(ReservationStatus.RESERVED);
    expect(state.tx.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { reservationExpiresAt: expiration },
    });
  });

  it('does not release stock after PAID when DECLINED/CANCELED arrives late', async () => {
    const state = harness({ coupon: true });
    await state.service.applyPaymentStatus('payment-1', 'paid');
    await state.service.applyPaymentStatus('payment-1', 'failed');

    expect(state.order.reservationStatus).toBe(ReservationStatus.COMMITTED);
    expect(state.payment.status).toBe('paid');
    expect(state.product.stock).toBe(0);
    expect(state.coupon).toEqual({ reserved: 0, used: 1 });
  });

  it('rejects PAID after a reservation was released', async () => {
    const state = harness();
    await state.service.applyPaymentStatus('payment-1', 'failed');
    await expect(state.service.applyPaymentStatus('payment-1', 'paid')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
