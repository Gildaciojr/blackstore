import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';

type ProductUpdateArgs = {
  where: {
    id: string;
  };
  data: {
    reservedStock?: number;
  };
};

type CartUpdateManyArgs = {
  where: {
    id: string;
    customerId: string;
    quantity: {
      gt: number;
    };
  };
  data: {
    quantity: {
      decrement: number;
    };
  };
};

type CartDeleteManyArgs = {
  where: {
    id: string;
    customerId: string;
    quantity: number;
  };
};

describe('OrdersService Phase C reservations', () => {
  function atomicStockHarness(stock: number, variant = false) {
    const product = {
      stock,
      reservedStock: 0,
    };

    const productVariant = {
      stock,
      reservedStock: 0,
    };

    const tx = {
      $queryRaw: jest.fn(async (query: unknown) => {
        void query;
        return [];
      }),

      $executeRaw: jest.fn(async (query: unknown) => {
        void query;

        const inventory = variant ? productVariant : product;

        const availableStock = inventory.stock - inventory.reservedStock;

        if (availableStock < 1) {
          return 0;
        }

        inventory.reservedStock += 1;

        return 1;
      }),

      product: {
        update: jest.fn(async ({ data }: ProductUpdateArgs) => {
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
        aggregate: jest.fn(
          async (args: {
            where: {
              productId: string;
            };
            _sum: {
              reservedStock: boolean;
            };
          }) => {
            void args;

            return {
              _sum: {
                reservedStock: productVariant.reservedStock,
              },
            };
          },
        ),
      },
    };

    const prisma = {} as PrismaService;
    const service = new OrdersService(prisma);

    const item = {
      productId: 'product-1',
      variantId: variant ? 'variant-1' : null,
      quantity: 1,
      product: {
        name: 'Produto',
        variants: variant
          ? [
              {
                id: 'variant-1',
              },
            ]
          : [],
      },
      variant: variant
        ? {
            id: 'variant-1',
            productId: 'product-1',
            size: 'M',
          }
        : null,
    };

    const reserve = () =>
      (
        service as unknown as {
          reserveStock: (transaction: unknown, items: unknown[]) => Promise<void>;
        }
      ).reserveStock(tx, [item]);

    return {
      product,
      productVariant,
      tx,
      reserve,
    };
  }

  it.each([false, true])(
    'protects the last %s stock unit across simultaneous reservations without decreasing physical stock',
    async (variant) => {
      const state = atomicStockHarness(1, variant);

      const results = await Promise.allSettled([state.reserve(), state.reserve()]);

      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);

      expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);

      if (variant) {
        expect(state.productVariant).toEqual({
          stock: 1,
          reservedStock: 1,
        });

        expect(state.product).toEqual({
          stock: 1,
          reservedStock: 1,
        });
      } else {
        expect(state.product).toEqual({
          stock: 1,
          reservedStock: 1,
        });
      }
    },
  );

  it('keeps physical Product.stock unchanged and synchronizes Product.reservedStock with variant reservations', async () => {
    const state = atomicStockHarness(2, true);

    await state.reserve();

    expect(state.productVariant).toEqual({
      stock: 2,
      reservedStock: 1,
    });

    expect(state.product).toEqual({
      stock: 2,
      reservedStock: 1,
    });

    expect(state.tx.productVariant.aggregate).toHaveBeenCalledWith({
      where: {
        productId: 'product-1',
      },
      _sum: {
        reservedStock: true,
      },
    });

    expect(state.tx.product.update).toHaveBeenCalledWith({
      where: {
        id: 'product-1',
      },
      data: {
        reservedStock: 1,
      },
    });
  });

  it('allows only one reservation of the last coupon use', async () => {
    const coupon = {
      id: 'coupon-1',
      discount: 10,
      used: 0,
      reserved: 0,
      maxUses: 1,
    };

    const tx = {
      coupon: {
        findUnique: jest.fn(async () => coupon),
      },

      $executeRaw: jest.fn(async (query: unknown) => {
        void query;

        if (coupon.used + coupon.reserved >= coupon.maxUses) {
          return 0;
        }

        coupon.reserved += 1;

        return 1;
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

    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);

    expect(coupon.reserved).toBe(1);
  });

  it('returns the same Order on a same-customer checkoutKey retry', async () => {
    const order = {
      id: 'order-1',
      customerId: 'customer-1',
    };

    const prisma = {
      order: {
        findUnique: jest.fn(async () => order),
      },

      $transaction: jest.fn(async (callback: unknown) => {
        void callback;
        throw new Error('$transaction must not be called');
      }),
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
    const order = {
      id: 'order-1',
      customerId: 'customer-1',
    };

    let findUniqueCalls = 0;

    const prisma = {
      order: {
        findUnique: jest.fn(async () => {
          findUniqueCalls += 1;

          return findUniqueCalls === 1 ? null : order;
        }),
      },

      $transaction: jest.fn(async (callback: unknown) => {
        void callback;

        throw Object.assign(new Error('unique checkoutKey'), {
          code: 'P2002',
        });
      }),
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
        findUnique: jest.fn(async () => ({
          id: 'order-1',
          customerId: 'customer-2',
        })),
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

  it('fails a multi-item reservation atomically when any item has no available stock', async () => {
    const committed = new Map<
      string,
      {
        stock: number;
        reservedStock: number;
      }
    >([
      [
        'product-1',
        {
          stock: 1,
          reservedStock: 0,
        },
      ],
      [
        'product-2',
        {
          stock: 0,
          reservedStock: 0,
        },
      ],
    ]);

    const prisma = {
      $transaction: async <T>(callback: (transaction: unknown) => Promise<T>): Promise<T> => {
        const working = new Map<
          string,
          {
            stock: number;
            reservedStock: number;
          }
        >(
          [...committed.entries()].map(([id, inventory]) => [
            id,
            {
              ...inventory,
            },
          ]),
        );

        const orderedProductIds = ['product-1', 'product-2'];

        let executeIndex = 0;

        const tx = {
          $queryRaw: jest.fn(async (query: unknown) => {
            void query;
            return [];
          }),

          $executeRaw: jest.fn(async (query: unknown) => {
            void query;

            const productId = orderedProductIds[executeIndex];

            executeIndex += 1;

            const inventory = working.get(productId);

            if (!inventory) {
              return 0;
            }

            const availableStock = inventory.stock - inventory.reservedStock;

            if (availableStock < 1) {
              return 0;
            }

            inventory.reservedStock += 1;

            return 1;
          }),

          product: {
            update: jest.fn(),
          },

          productVariant: {
            aggregate: jest.fn(),
          },
        };

        const result = await callback(tx);

        for (const [id, inventory] of working) {
          committed.set(id, {
            ...inventory,
          });
        }

        return result;
      },
    };

    const service = new OrdersService(prisma as unknown as PrismaService);

    const items = ['product-1', 'product-2'].map((productId) => ({
      productId,
      variantId: null,
      quantity: 1,
      product: {
        name: productId,
        variants: [],
      },
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

    /*
     * A transação falhou no segundo item.
     *
     * Portanto nem mesmo a reserva do primeiro
     * item pode ser persistida.
     */
    expect(Object.fromEntries(committed)).toEqual({
      'product-1': {
        stock: 1,
        reservedStock: 0,
      },
      'product-2': {
        stock: 0,
        reservedStock: 0,
      },
    });
  });

  it('removes only snapshot quantities and preserves items added later', async () => {
    const tx = {
      cartItem: {
        updateMany: jest.fn(async (args: CartUpdateManyArgs) => {
          void args;

          return {
            count: 1,
          };
        }),

        deleteMany: jest.fn(async (args: CartDeleteManyArgs) => {
          void args;

          return {
            count: 0,
          };
        }),
      },
    };

    const service = new OrdersService({} as PrismaService);

    await (
      service as unknown as {
        removeReservedCartSnapshot: (transaction: unknown, values: unknown[]) => Promise<void>;
      }
    ).removeReservedCartSnapshot(tx, [
      {
        id: 'cart-1',
        customerId: 'customer-1',
        quantity: 2,
      },
    ]);

    expect(tx.cartItem.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'cart-1',
        customerId: 'customer-1',
        quantity: {
          gt: 2,
        },
      },
      data: {
        quantity: {
          decrement: 2,
        },
      },
    });

    expect(tx.cartItem.deleteMany).not.toHaveBeenCalled();
  });
});
