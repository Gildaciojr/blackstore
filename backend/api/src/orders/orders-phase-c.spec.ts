import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';

describe('OrdersService Phase C reservations', () => {
  function atomicStockHarness(stock: number, variant = false) {
    const state = { stock };
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      product: {
        updateMany: jest.fn().mockImplementation(({ where, data }) => {
          if (state.stock < where.stock.gte) return Promise.resolve({ count: 0 });
          state.stock -= data.stock.decrement;
          return Promise.resolve({ count: 1 });
        }),
        update: jest.fn().mockImplementation(({ data }) => {
          if (typeof data.stock === 'number') state.stock = data.stock;
          return Promise.resolve({ id: 'product-1', stock: state.stock });
        }),
      },
      productVariant: {
        updateMany: jest.fn().mockImplementation(({ where, data }) => {
          if (state.stock < where.stock.gte) return Promise.resolve({ count: 0 });
          state.stock -= data.stock.decrement;
          return Promise.resolve({ count: 1 });
        }),
        aggregate: jest
          .fn()
          .mockImplementation(() => Promise.resolve({ _sum: { stock: state.stock } })),
      },
    };
    const prisma = {} as PrismaService;
    const service = new OrdersService(prisma);
    const item = {
      productId: 'product-1',
      variantId: variant ? 'variant-1' : null,
      quantity: 1,
      product: { name: 'Produto', variants: variant ? [{ id: 'variant-1' }] : [] },
      variant: variant ? { id: 'variant-1', productId: 'product-1', size: 'M' } : null,
    };
    const reserve = () =>
      (
        service as unknown as {
          reserveStock: (transaction: unknown, items: unknown[]) => Promise<void>;
        }
      ).reserveStock(tx, [item]);
    return { state, tx, reserve };
  }

  it.each([false, true])(
    'protects the last %s stock unit across simultaneous reservations',
    async (variant) => {
      const state = atomicStockHarness(1, variant);
      const results = await Promise.allSettled([state.reserve(), state.reserve()]);

      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
      expect(state.state.stock).toBe(0);
    },
  );

  it('keeps Product.stock equal to the variant aggregate after reservation', async () => {
    const state = atomicStockHarness(2, true);
    await state.reserve();
    expect(state.state.stock).toBe(1);
    expect(state.tx.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { stock: 1 },
    });
  });

  it('allows only one reservation of the last coupon use', async () => {
    const coupon = { id: 'coupon-1', discount: 10, used: 0, reserved: 0, maxUses: 1 };
    const tx = {
      coupon: { findUnique: jest.fn().mockResolvedValue(coupon) },
      $executeRaw: jest.fn().mockImplementation(() => {
        if (coupon.used + coupon.reserved >= coupon.maxUses) return Promise.resolve(0);
        coupon.reserved += 1;
        return Promise.resolve(1);
      }),
    };
    const service = new OrdersService({} as PrismaService);
    const reserve = () =>
      (
        service as unknown as {
          reserveCoupon: (transaction: unknown, code: string, subtotal: number) => Promise<unknown>;
        }
      ).reserveCoupon(tx, 'ultimo', 100);
    const results = await Promise.allSettled([reserve(), reserve()]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(coupon.reserved).toBe(1);
  });

  it('returns the same Order on a same-customer checkoutKey retry', async () => {
    const order = { id: 'order-1', customerId: 'customer-1' };
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue(order) },
      $transaction: jest.fn(),
    };
    const service = new OrdersService(prisma as unknown as PrismaService);
    const result = await service.createOrder(
      {
        checkoutKey: '11111111-1111-4111-8111-111111111111',
        customerId: 'customer-1',
        addressId: '22222222-2222-4222-8222-222222222222',
        shippingPrice: 10,
        shippingMethod: 'standard',
        shippingName: 'Padrão',
        shippingDeadline: '7 dias',
      },
      'customer-1',
    );

    expect(result).toBe(order);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns the concurrent winner after a checkoutKey unique conflict', async () => {
    const order = { id: 'order-1', customerId: 'customer-1' };
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(order),
      },
      $transaction: jest
        .fn()
        .mockRejectedValue(Object.assign(new Error('unique checkoutKey'), { code: 'P2002' })),
    };
    const service = new OrdersService(prisma as unknown as PrismaService);
    await expect(
      service.createOrder(
        {
          checkoutKey: '11111111-1111-4111-8111-111111111111',
          customerId: 'customer-1',
          addressId: '22222222-2222-4222-8222-222222222222',
          shippingPrice: 10,
          shippingMethod: 'standard',
          shippingName: 'Padrão',
          shippingDeadline: '7 dias',
        },
        'customer-1',
      ),
    ).resolves.toBe(order);
  });

  it('rejects reuse of a checkoutKey owned by another customer', async () => {
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue({ id: 'order-1', customerId: 'customer-2' }),
      },
    };
    const service = new OrdersService(prisma as unknown as PrismaService);
    await expect(
      service.createOrder(
        {
          checkoutKey: '11111111-1111-4111-8111-111111111111',
          customerId: 'customer-1',
          addressId: '22222222-2222-4222-8222-222222222222',
          shippingPrice: 10,
          shippingMethod: 'standard',
          shippingName: 'Padrão',
          shippingDeadline: '7 dias',
        },
        'customer-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('fails a multi-item reservation when any item is out of stock', async () => {
    const committed = new Map([
      ['product-1', 1],
      ['product-2', 0],
    ]);
    const prisma = {
      $transaction: jest.fn().mockImplementation(async (callback) => {
        const working = new Map(committed);
        const tx = {
          $queryRaw: jest.fn().mockResolvedValue([]),
          product: {
            updateMany: jest
              .fn()
              .mockImplementation(
                ({
                  where,
                  data,
                }: {
                  where: { id: string; stock: { gte: number } };
                  data: { stock: { decrement: number } };
                }) => {
                  const stock = working.get(where.id) ?? 0;
                  if (stock < where.stock.gte) return Promise.resolve({ count: 0 });
                  working.set(where.id, stock - data.stock.decrement);
                  return Promise.resolve({ count: 1 });
                },
              ),
            update: jest.fn(),
          },
          productVariant: { updateMany: jest.fn(), aggregate: jest.fn() },
        };
        const result = await callback(tx);
        for (const [id, stock] of working) committed.set(id, stock);
        return result;
      }),
    };
    const service = new OrdersService(prisma as unknown as PrismaService);
    const items = ['product-1', 'product-2'].map((productId) => ({
      productId,
      variantId: null,
      quantity: 1,
      product: { name: productId, variants: [] },
      variant: null,
    }));

    await expect(
      prisma.$transaction((tx) =>
        (
          service as unknown as {
            reserveStock: (transaction: unknown, values: unknown[]) => Promise<void>;
          }
        ).reserveStock(tx, items),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(Object.fromEntries(committed)).toEqual({ 'product-1': 1, 'product-2': 0 });
  });

  it('removes only snapshot quantities and preserves items added later', async () => {
    const tx = {
      cartItem: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn(),
      },
    };
    const service = new OrdersService({} as PrismaService);
    await (
      service as unknown as {
        removeReservedCartSnapshot: (transaction: unknown, values: unknown[]) => Promise<void>;
      }
    ).removeReservedCartSnapshot(tx, [{ id: 'cart-1', customerId: 'customer-1', quantity: 2 }]);

    expect(tx.cartItem.updateMany).toHaveBeenCalledWith({
      where: { id: 'cart-1', customerId: 'customer-1', quantity: { gt: 2 } },
      data: { quantity: { decrement: 2 } },
    });
    expect(tx.cartItem.deleteMany).not.toHaveBeenCalled();
  });
});
