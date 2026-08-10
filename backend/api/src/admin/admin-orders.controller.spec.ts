import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { AdminOrdersController } from './admin-orders.controller';

describe('AdminOrdersController Phase C lifecycle protection', () => {
  const prisma = {
    order: { update: jest.fn().mockResolvedValue({ id: 'order-1' }) },
  };
  const controller = new AdminOrdersController(prisma as unknown as PrismaService);

  it.each(['paid', 'canceled', 'failed', 'pending'])(
    'blocks direct financial status %s',
    (status) => {
      expect(() => controller.updateStatus('order-1', status)).toThrow(BadRequestException);
    },
  );

  it.each(['processing', 'shipped', 'delivered'])('allows logistical status %s', async (status) => {
    await expect(controller.updateStatus('order-1', status)).resolves.toEqual({ id: 'order-1' });
  });
});
