import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { PaymentService } from '../payment/providers/payment.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { OrderLifecycleService } from '../orders/order-lifecycle.service';

describe('Phase A customer ownership', () => {
  function prismaMock() {
    return {
      $transaction: jest.fn(),
      order: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      payment: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      customer: {
        findUnique: jest.fn(),
      },
    };
  }

  it('does not return an order owned by customer B to customer A', async () => {
    const prisma = prismaMock();
    prisma.order.findFirst.mockResolvedValue(null);
    const service = new OrdersService(prisma as unknown as PrismaService);

    await expect(service.getOrder('order-b', 'customer-a')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'order-b', customerId: 'customer-a' } }),
    );
  });

  it('does not return a payment owned by customer B to customer A', async () => {
    const prisma = prismaMock();
    prisma.payment.findFirst.mockResolvedValue(null);
    const service = new PaymentService(
      prisma as unknown as PrismaService,
      {} as OrderLifecycleService,
    );

    await expect(service.getPayment('order-b', 'customer-a')).resolves.toBeNull();
    expect(prisma.payment.findFirst).toHaveBeenCalledWith({
      where: {
        orderId: 'order-b',
        order: { customerId: 'customer-a' },
      },
    });
  });

  it('does not initiate payment for an order owned by customer B', async () => {
    const prisma = prismaMock();
    prisma.order.findUnique.mockResolvedValue({ id: 'order-b', customerId: 'customer-b' });
    const service = new PaymentService(
      prisma as unknown as PrismaService,
      {} as OrderLifecycleService,
    );

    await expect(
      service.createPayment({ orderId: 'order-b', method: 'pix' }, 'customer-a'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.payment.findUnique).not.toHaveBeenCalled();
  });

  it('does not accept a checkout identity from another customer', async () => {
    const prisma = prismaMock();
    const service = new OrdersService(prisma as unknown as PrismaService);

    await expect(
      service.createOrder(
        {
          checkoutKey: '11111111-1111-4111-8111-111111111111',
          customerId: 'customer-b',
          addressId: 'address-b',
          shippingPrice: 10,
          shippingMethod: 'standard',
          shippingName: 'Padrão',
          shippingDeadline: '7 dias',
        },
        'customer-a',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('uses an explicit public customer select that excludes password hashes', async () => {
    const prisma = prismaMock();
    prisma.order.findFirst.mockResolvedValue({
      id: 'order-a',
      customerId: 'customer-a',
      customer: { id: 'customer-a', email: 'customer@example.test' },
    });
    const service = new OrdersService(prisma as unknown as PrismaService);

    const result = await service.getOrder('order-a', 'customer-a');
    const query = prisma.order.findFirst.mock.calls[0][0];

    expect(query.include.customer.select).not.toHaveProperty('password');
    expect(JSON.stringify(result)).not.toContain('password');
  });
});
