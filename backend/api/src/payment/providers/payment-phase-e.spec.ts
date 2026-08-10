import { ForbiddenException } from '@nestjs/common';
import { ReservationStatus, type Payment } from '@prisma/client';
import type { OrderLifecycleService } from '../../orders/order-lifecycle.service';
import type { PrismaService } from '../../prisma/prisma.service';
import {
  createPagbankIdempotencyKey,
  PagbankProvider,
  type PagbankOrderResult,
} from './pagbank.provider';
import { PaymentReconciliationService } from './payment-reconciliation.service';
import { PaymentService } from './payment.service';

describe('Payment reconciliation Phase E', () => {
  function providerResult(
    status: string,
    overrides: Partial<PagbankOrderResult> = {},
  ): PagbankOrderResult {
    const normalized =
      status === 'PAID'
        ? 'paid'
        : status === 'DECLINED' || status === 'CANCELED'
          ? 'failed'
          : 'pending';
    return {
      providerRef: 'ORDE_1',
      providerId: 'CHAR_1',
      referenceId: 'order-1',
      providerStatus: status,
      status: normalized,
      providerAmountCents: 1099,
      currency: 'BRL',
      qrCode: null,
      qrCodeText: null,
      qrCodeId: null,
      qrCodeExpiration: null,
      cardLast4: null,
      cardBrand: null,
      ...overrides,
    };
  }

  function harness(options?: {
    providerRef?: string | null;
    method?: string;
    outcomeUnknown?: boolean;
    expired?: boolean;
  }) {
    const order = {
      id: 'order-1',
      customerId: 'customer-1',
      total: 10.99,
      status: 'pending',
      reservationStatus: ReservationStatus.RESERVED as ReservationStatus,
      reservationExpiresAt: options?.expired ? new Date(Date.now() - 60_000) : null,
      couponId: null,
      createdAt: new Date('2026-08-10T12:00:00.000Z'),
      customer: {
        id: 'customer-1',
        name: 'Cliente',
        surname: 'Teste',
        email: 'customer@example.test',
        cpf: '12345678901',
        phone: '11999999999',
      },
    };
    const payment: Payment = {
      id: 'payment-1',
      orderId: order.id,
      method: options?.method ?? 'pix',
      status: 'pending',
      amount: order.total,
      provider: 'pagbank',
      providerId: null,
      providerRef: options?.providerRef === undefined ? 'ORDE_1' : options.providerRef,
      qrCode: null,
      qrCodeText: null,
      cardLast4: null,
      cardBrand: null,
      cardHolderName: null,
      installments: null,
      cardExpMonth: null,
      cardExpYear: null,
      createdAt: new Date(Date.now() - 120_000),
      updatedAt: new Date(Date.now() - 120_000),
    };
    const logs: Array<Record<string, unknown>> = [];
    const prisma = {
      $transaction: jest.fn().mockImplementation((callback) => callback(prisma)),
      payment: {
        findUnique: jest.fn().mockImplementation(({ where, include }) => {
          if (where.orderId && where.orderId !== order.id) return Promise.resolve(null);
          if (where.id && where.id !== payment.id) return Promise.resolve(null);
          if (include?.order?.include?.customer) {
            return Promise.resolve({ ...payment, order: { ...order } });
          }
          if (include?.order) return Promise.resolve({ ...payment, order: { ...order } });
          return Promise.resolve({ ...payment });
        }),
        updateMany: jest.fn().mockImplementation(({ where, data }) => {
          if (where.updatedAt?.lte && payment.updatedAt > where.updatedAt.lte) {
            return Promise.resolve({ count: 0 });
          }
          if (where.providerRef === null && payment.providerRef !== null)
            return Promise.resolve({ count: 0 });
          if (where.providerId === null && payment.providerId !== null)
            return Promise.resolve({ count: 0 });
          Object.assign(payment, data);
          return Promise.resolve({ count: 1 });
        }),
      },
      paymentLog: {
        create: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => {
          logs.push(data);
          return Promise.resolve({ id: `log-${logs.length}`, ...data });
        }),
        findFirst: jest
          .fn()
          .mockResolvedValue(
            options?.outcomeUnknown
              ? { rawPayload: { source: 'synchronous', outcomeUnknown: true } }
              : null,
          ),
      },
    };
    const lifecycle = {
      applyPaymentStatus: jest.fn().mockImplementation((_id, status, providerData) => {
        Object.assign(payment, providerData, { status, updatedAt: new Date() });
        if (status === 'paid') {
          order.status = 'paid';
          order.reservationStatus = ReservationStatus.COMMITTED;
        } else if (status === 'failed') {
          order.status = 'canceled';
          order.reservationStatus = ReservationStatus.RELEASED;
        }
        return Promise.resolve({ ...payment });
      }),
    };
    const paymentService = new PaymentService(
      prisma as unknown as PrismaService,
      lifecycle as unknown as OrderLifecycleService,
    );
    const reconciliation = new PaymentReconciliationService(
      prisma as unknown as PrismaService,
      paymentService,
    );
    return { reconciliation, prisma, lifecycle, payment, order, logs };
  }

  afterEach(() => jest.restoreAllMocks());

  it.each([
    ['PAID', 'paid', 'paid', ReservationStatus.COMMITTED],
    ['DECLINED', 'failed', 'canceled', ReservationStatus.RELEASED],
    ['CANCELED', 'failed', 'canceled', ReservationStatus.RELEASED],
  ] as const)(
    'recovers %s through the shared lifecycle',
    async (external, paymentStatus, orderStatus, reservation) => {
      const state = harness();
      jest.spyOn(PagbankProvider.prototype, 'getOrder').mockResolvedValue(providerResult(external));

      await state.reconciliation.reconcileOrder('order-1', 'customer-1');
      expect(state.payment.status).toBe(paymentStatus);
      expect(state.order.status).toBe(orderStatus);
      expect(state.order.reservationStatus).toBe(reservation);
    },
  );

  it.each(['WAITING', 'IN_ANALYSIS', 'AUTHORIZED'])(
    '%s keeps the reservation pending',
    async (external) => {
      const state = harness();
      jest.spyOn(PagbankProvider.prototype, 'getOrder').mockResolvedValue(providerResult(external));

      const result = await state.reconciliation.reconcileOrder('order-1', 'customer-1');
      expect(result.status).toBe('pending');
      expect(state.order.reservationStatus).toBe(ReservationStatus.RESERVED);
    },
  );

  it('does not regress a locally PAID payment when GET reports WAITING', async () => {
    const state = harness();
    state.payment.status = 'paid';
    state.order.status = 'paid';
    state.order.reservationStatus = ReservationStatus.COMMITTED;
    jest.spyOn(PagbankProvider.prototype, 'getOrder').mockResolvedValue(providerResult('WAITING'));

    const result = await state.reconciliation.reconcileOrder('order-1', 'customer-1');
    expect(result).toMatchObject({ status: 'paid', outcome: 'ignored' });
    expect(state.order.reservationStatus).toBe(ReservationStatus.COMMITTED);
  });

  it('does not release an expired PIX while the gateway still reports WAITING', async () => {
    const state = harness({ expired: true });
    const getOrder = jest
      .spyOn(PagbankProvider.prototype, 'getOrder')
      .mockResolvedValue(providerResult('WAITING'));

    await state.reconciliation.reconcileOrder('order-1', 'customer-1');
    expect(getOrder).toHaveBeenCalledTimes(1);
    expect(state.lifecycle.applyPaymentStatus).not.toHaveBeenCalled();
    expect(state.order.reservationStatus).toBe(ReservationStatus.RESERVED);
  });

  it.each([
    ['amount', { providerAmountCents: 1098 }, 'provider_amount_mismatch'],
    ['currency', { currency: 'USD' }, 'provider_currency_mismatch'],
    ['reference', { referenceId: 'order-other' }, 'reference_id_mismatch'],
    ['providerRef', { providerRef: 'ORDE_OTHER' }, 'provider_order_id_mismatch'],
  ] as const)('sends %s divergence to manual review', async (_field, overrides, reason) => {
    const state = harness();
    jest
      .spyOn(PagbankProvider.prototype, 'getOrder')
      .mockResolvedValue(providerResult('PAID', overrides));

    const result = await state.reconciliation.reconcileOrder('order-1', 'customer-1');
    expect(result).toMatchObject({
      outcome: expect.stringMatching(/ignored|manual_review/),
      reason,
    });
    expect(state.order.reservationStatus).toBe(ReservationStatus.RESERVED);
  });

  it('rejects a contradictory Charge ID', async () => {
    const state = harness();
    state.payment.providerId = 'CHAR_EXISTING';
    jest.spyOn(PagbankProvider.prototype, 'getOrder').mockResolvedValue(providerResult('PAID'));

    const result = await state.reconciliation.reconcileOrder('order-1', 'customer-1');
    expect(result.reason).toBe('provider_charge_id_mismatch');
    expect(state.order.reservationStatus).toBe(ReservationStatus.RESERVED);
  });

  it.each([
    [404, 'manual_review', 'provider_order_not_found'],
    [500, 'unavailable', 'provider_temporarily_unavailable'],
    [null, 'unavailable', 'provider_network_error'],
  ] as const)('keeps local state on provider failure %s', async (status, outcome, reason) => {
    const state = harness();
    jest
      .spyOn(PagbankProvider.prototype, 'getOrder')
      .mockRejectedValue(
        status === null
          ? { isAxiosError: true, code: 'ECONNABORTED' }
          : { isAxiosError: true, response: { status } },
      );

    const result = await state.reconciliation.reconcileOrder('order-1', 'customer-1');
    expect(result).toMatchObject({ outcome, reason, status: 'pending' });
    expect(state.order.reservationStatus).toBe(ReservationStatus.RESERVED);
  });

  it('recovers a missing providerRef by retrying PIX with the same idempotency key', async () => {
    const state = harness({ providerRef: null, outcomeUnknown: true });
    const retry = jest.spyOn(PagbankProvider.prototype, 'createPixPayment').mockResolvedValue({
      ...providerResult('WAITING'),
      status: 'pending',
    });

    await state.reconciliation.reconcileOrder('order-1', 'customer-1');
    expect(retry).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceId: 'order-1',
        idempotencyKey: createPagbankIdempotencyKey('order-1', 'pix'),
        expirationDate: '2026-08-10T14:00:00.000Z',
      }),
    );
    expect(state.payment.providerRef).toBe('ORDE_1');
  });

  it('does not retry card creation without the original encrypted token', async () => {
    const state = harness({ providerRef: null, outcomeUnknown: true, method: 'card' });
    const retry = jest.spyOn(PagbankProvider.prototype, 'createCardPayment');
    const result = await state.reconciliation.reconcileOrder('order-1', 'customer-1');

    expect(result).toMatchObject({
      outcome: 'manual_review',
      reason: 'card_retry_requires_original_encrypted_token',
    });
    expect(retry).not.toHaveBeenCalled();
  });

  it('allows only one concurrent request to call PagBank during the cooldown', async () => {
    const state = harness();
    let release!: (value: PagbankOrderResult) => void;
    const pending = new Promise<PagbankOrderResult>((resolve) => {
      release = resolve;
    });
    const getOrder = jest.spyOn(PagbankProvider.prototype, 'getOrder').mockReturnValue(pending);

    const first = state.reconciliation.reconcileOrder('order-1', 'customer-1');
    await Promise.resolve();
    const second = await state.reconciliation.reconcileOrder('order-1', 'customer-1');
    expect(second.outcome).toBe('throttled');
    expect(getOrder).toHaveBeenCalledTimes(1);
    release(providerResult('WAITING'));
    await first;
  });

  it('enforces customer ownership before calling PagBank', async () => {
    const state = harness();
    const getOrder = jest.spyOn(PagbankProvider.prototype, 'getOrder');
    await expect(
      state.reconciliation.reconcileOrder('order-1', 'customer-2'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(getOrder).not.toHaveBeenCalled();
  });

  it('stores sanitized reconciliation logs without provider payload or customer data', async () => {
    const state = harness();
    jest.spyOn(PagbankProvider.prototype, 'getOrder').mockResolvedValue(providerResult('WAITING'));
    await state.reconciliation.reconcileOrder('order-1', 'customer-1');

    const serialized = JSON.stringify(state.logs);
    expect(serialized).toContain('RECONCILIATION_STARTED');
    expect(serialized).not.toContain('customer@example.test');
    expect(serialized).not.toContain('12345678901');
  });
});
