import type { Payment } from '@prisma/client';
import type { OrderLifecycleService } from '../../orders/order-lifecycle.service';
import type { PrismaService } from '../../prisma/prisma.service';
import { PaymentService } from './payment.service';
import { decidePaymentTransition } from './payment-state-machine';

describe('PaymentService Phase D financial integrity', () => {
  function harness(initialStatus = 'processing') {
    const order = {
      id: 'order-1',
      customerId: 'customer-1',
      total: 10.99,
      status: 'pending',
      reservationStatus: 'RESERVED',
      couponId: null,
    };
    const payment: Payment = {
      id: 'payment-1',
      orderId: order.id,
      method: 'card',
      status: initialStatus,
      amount: order.total,
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
    const logs: Array<{ data: Record<string, unknown> }> = [];

    const prisma = {
      payment: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          if (where.providerId) {
            return Promise.resolve(payment.providerId === where.providerId ? payment : null);
          }
          if (where.providerRef) {
            return Promise.resolve(payment.providerRef === where.providerRef ? payment : null);
          }
          return Promise.resolve(null);
        }),
        findUnique: jest.fn().mockImplementation(({ where, include }) => {
          if (where.orderId && where.orderId !== payment.orderId) return Promise.resolve(null);
          if (where.id && where.id !== payment.id) return Promise.resolve(null);
          return Promise.resolve(include?.order ? { ...payment, order: { ...order } } : payment);
        }),
        updateMany: jest.fn().mockImplementation(({ where, data }) => {
          if (where.providerRef === null && payment.providerRef !== null) {
            return Promise.resolve({ count: 0 });
          }
          if (where.providerId === null && payment.providerId !== null) {
            return Promise.resolve({ count: 0 });
          }
          Object.assign(payment, data);
          return Promise.resolve({ count: 1 });
        }),
      },
      paymentLog: {
        create: jest.fn().mockImplementation(({ data }) => {
          logs.push({ data });
          return Promise.resolve({ id: `log-${logs.length}`, ...data });
        }),
      },
    };
    const lifecycle = {
      applyPaymentStatus: jest.fn().mockImplementation((_id, status, providerData) => {
        Object.assign(payment, providerData, { status });
        if (status === 'paid') {
          order.status = 'paid';
          order.reservationStatus = 'COMMITTED';
        } else if (status === 'failed') {
          order.status = 'canceled';
          order.reservationStatus = 'RELEASED';
        }
        return Promise.resolve({ ...payment });
      }),
    };
    const service = new PaymentService(
      prisma as unknown as PrismaService,
      lifecycle as unknown as OrderLifecycleService,
    );
    const webhook = (status: string, overrides: Record<string, unknown> = {}) =>
      service.confirmWebhook({
        id: 'ORDE_1',
        reference_id: order.id,
        charges: [
          {
            id: 'CHAR_1',
            status,
            amount: { value: 1099, currency: 'BRL' },
          },
        ],
        ...overrides,
      });

    return { service, prisma, lifecycle, payment, order, logs, webhook };
  }

  it('accepts PAID only with the exact amount in cents and commits atomically', async () => {
    const state = harness();
    await expect(state.webhook('PAID')).resolves.toMatchObject({
      success: true,
      outcome: 'processed',
    });

    expect(state.lifecycle.applyPaymentStatus).toHaveBeenCalledWith(
      'payment-1',
      'paid',
      expect.objectContaining({ providerRef: 'ORDE_1', providerId: 'CHAR_1' }),
      undefined,
    );
    expect(state.payment).toMatchObject({
      status: 'paid',
      providerRef: 'ORDE_1',
      providerId: 'CHAR_1',
    });
    expect(state.order).toMatchObject({ status: 'paid', reservationStatus: 'COMMITTED' });
  });

  it.each([
    ['divergent', { value: 1098, currency: 'BRL' }, 'provider_amount_mismatch'],
    ['missing', undefined, 'provider_amount_missing'],
    ['wrong currency', { value: 1099, currency: 'USD' }, 'provider_currency_mismatch'],
  ] as const)('ignores PAID with %s amount boundary', async (_label, amount, reason) => {
    const state = harness();
    const result = await state.service.confirmWebhook({
      id: 'ORDE_1',
      reference_id: 'order-1',
      charges: [{ id: 'CHAR_1', status: 'PAID', amount }],
    });

    expect(result).toMatchObject({ success: true, outcome: 'ignored', reason });
    expect(state.lifecycle.applyPaymentStatus).not.toHaveBeenCalledWith(
      'payment-1',
      'paid',
      expect.anything(),
      expect.anything(),
    );
    expect(state.order.reservationStatus).toBe('RESERVED');
    expect(state.logs.some((entry) => entry.data.type === 'AMOUNT_MISMATCH')).toBe(true);
  });

  it('preserves verified PagBank Order and Charge IDs', async () => {
    const state = harness();
    await state.webhook('PAID');
    expect(state.payment.providerRef).toBe('ORDE_1');
    expect(state.payment.providerId).toBe('CHAR_1');
  });

  it('atomically fills missing provider IDs even when the normalized status is duplicated', async () => {
    const state = harness('pending');
    const result = await state.webhook('WAITING');

    expect(result).toMatchObject({ success: true, outcome: 'duplicate' });
    expect(state.payment).toMatchObject({ providerRef: 'ORDE_1', providerId: 'CHAR_1' });
  });

  it.each([
    ['providerRef', 'ORDE_OTHER', null, 'provider_order_id_mismatch'],
    ['providerId', null, 'CHAR_OTHER', 'provider_charge_id_mismatch'],
  ] as const)(
    'rejects a contradictory %s without changing lifecycle',
    async (_field, providerRef, providerId, reason) => {
      const state = harness();
      state.payment.providerRef = providerRef;
      state.payment.providerId = providerId;

      const result = await state.webhook('PAID');
      expect(result).toMatchObject({ success: true, outcome: 'ignored', reason });
      expect(state.lifecycle.applyPaymentStatus).not.toHaveBeenCalled();
    },
  );

  it('treats a repeated PAID webhook as a successful duplicate', async () => {
    const state = harness();
    await state.webhook('PAID');
    state.lifecycle.applyPaymentStatus.mockClear();
    const duplicate = await state.webhook('PAID');

    expect(duplicate).toMatchObject({ success: true, outcome: 'duplicate' });
    expect(state.lifecycle.applyPaymentStatus).not.toHaveBeenCalled();
    expect(state.logs.some((entry) => entry.data.type === 'WEBHOOK_DUPLICATE')).toBe(true);
  });

  it.each(['WAITING', 'IN_ANALYSIS', 'AUTHORIZED'])('%s can progress to PAID', async (weak) => {
    const state = harness();
    await state.webhook(weak);
    await expect(state.webhook('PAID')).resolves.toMatchObject({ outcome: 'processed' });
    expect(state.payment.status).toBe('paid');
    expect(state.order.reservationStatus).toBe('COMMITTED');
  });

  it.each(['WAITING', 'IN_ANALYSIS', 'DECLINED', 'CANCELED'])(
    'PAID cannot regress after a later %s event',
    async (lateStatus) => {
      const state = harness();
      await state.webhook('PAID');
      state.lifecycle.applyPaymentStatus.mockClear();
      const result = await state.webhook(lateStatus);

      expect(result).toMatchObject({ success: true, outcome: 'ignored' });
      expect(state.payment.status).toBe('paid');
      expect(state.order.reservationStatus).toBe('COMMITTED');
      expect(state.lifecycle.applyPaymentStatus).not.toHaveBeenCalled();
    },
  );

  it.each(['DECLINED', 'CANCELED'])(
    '%s followed by PAID requires manual review',
    async (failed) => {
      const state = harness();
      await state.webhook(failed);
      expect(state.order).toMatchObject({ status: 'canceled', reservationStatus: 'RELEASED' });
      state.lifecycle.applyPaymentStatus.mockClear();

      const paid = await state.webhook('PAID');
      expect(paid).toMatchObject({ success: true, outcome: 'manual_review' });
      expect(state.lifecycle.applyPaymentStatus).not.toHaveBeenCalled();
      expect(state.payment.status).toBe('failed');
    },
  );

  it('stores only an allowlisted sanitized webhook envelope', async () => {
    const state = harness();
    await state.service.confirmWebhook({
      id: 'ORDE_1',
      reference_id: 'order-1',
      charges: [{ id: 'CHAR_1', status: 'WAITING', amount: { value: 1099, currency: 'BRL' } }],
      customer: { email: 'secret@example.test', tax_id: '12345678901' },
      card: { number: '4111111111111111', security_code: '123' },
      qr_codes: [{ text: 'sensitive-qr-text' }],
    } as never);

    const serialized = JSON.stringify(state.logs);
    expect(serialized).not.toContain('secret@example.test');
    expect(serialized).not.toContain('12345678901');
    expect(serialized).not.toContain('4111111111111111');
    expect(serialized).not.toContain('sensitive-qr-text');
    expect(serialized).toContain('ORDE_1');
    expect(serialized).toContain('CHAR_1');
  });

  it('uses one explicit state machine for synchronous and webhook normalized statuses', () => {
    expect(decidePaymentTransition('processing', 'paid')).toEqual({
      action: 'apply',
      reason: 'valid_transition',
    });
    expect(decidePaymentTransition('paid', 'pending')).toEqual({
      action: 'ignore',
      reason: 'paid_cannot_regress',
    });
    expect(decidePaymentTransition('failed', 'paid')).toEqual({
      action: 'manual_review',
      reason: 'paid_after_reservation_release',
    });
  });
});
