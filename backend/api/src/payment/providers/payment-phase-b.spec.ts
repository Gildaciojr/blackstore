import type { Payment } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { PagbankProvider, type PagbankPaymentResult } from './pagbank.provider';
import { PaymentService } from './payment.service';
import type { OrderLifecycleService } from '../../orders/order-lifecycle.service';

describe('PaymentService Phase B idempotency', () => {
  const order = {
    id: 'order-123',
    customerId: 'customer-123',
    total: 10.99,
    reservationStatus: 'RESERVED',
    couponId: null,
    createdAt: new Date('2026-08-10T12:00:00.000Z'),
  };
  const customer = {
    id: 'customer-123',
    name: 'Cliente',
    surname: 'Teste',
    email: 'customer@example.test',
    cpf: '12345678901',
    phone: '11999999999',
  };

  const providerResult = (status: 'pending' | 'paid' | 'failed'): PagbankPaymentResult => ({
    providerRef: 'ORDE_123',
    providerId: 'CHAR_123',
    status,
    providerAmountCents: 1099,
    qrCode: null,
    qrCodeText: null,
    qrCodeId: null,
    qrCodeExpiration: null,
    cardLast4: '1111',
    cardBrand: 'visa',
  });

  function harness() {
    let payment: Payment | null = null;
    let sequence = 0;

    const prisma = {
      $transaction: jest.fn().mockImplementation((callback) => callback(prisma)),
      order: {
        findUnique: jest.fn().mockResolvedValue(order),
        update: jest.fn().mockImplementation(({ data }) => ({ ...order, ...data })),
      },
      customer: { findUnique: jest.fn().mockResolvedValue(customer) },
      paymentLog: { create: jest.fn().mockResolvedValue({ id: 'log-1' }) },
      payment: {
        create: jest.fn().mockImplementation(({ data }) => {
          if (payment) {
            return Promise.reject(
              Object.assign(new Error('Unique constraint violation'), { code: 'P2002' }),
            );
          }
          const now = new Date(Date.now() + sequence++);
          payment = {
            id: 'payment-123',
            orderId: order.id,
            method: data.method,
            status: data.status,
            amount: data.amount,
            provider: data.provider,
            providerId: null,
            providerRef: null,
            qrCode: null,
            qrCodeText: null,
            cardLast4: null,
            cardBrand: null,
            cardHolderName: data.cardHolderName ?? null,
            installments: data.installments ?? null,
            cardExpMonth: null,
            cardExpYear: null,
            createdAt: now,
            updatedAt: now,
          };
          return Promise.resolve(payment);
        }),
        findUnique: jest
          .fn()
          .mockImplementation((args) =>
            Promise.resolve(args?.include?.order && payment ? { ...payment, order } : payment),
          ),
        findFirst: jest.fn().mockImplementation(() => Promise.resolve(payment)),
        update: jest.fn().mockImplementation(({ data }) => {
          if (!payment) throw new Error('missing payment');
          payment = { ...payment, ...data, updatedAt: new Date(Date.now() + sequence++) };
          return Promise.resolve(payment);
        }),
        updateMany: jest.fn().mockImplementation(({ where, data }) => {
          if (!payment || (where.status && payment.status !== where.status)) {
            return Promise.resolve({ count: 0 });
          }
          payment = { ...payment, ...data, updatedAt: new Date(Date.now() + sequence++) };
          return Promise.resolve({ count: 1 });
        }),
      },
    };

    const lifecycle = {
      applyPaymentStatus: jest.fn().mockImplementation((_id, status, data) => {
        if (!payment) throw new Error('missing payment');
        payment = { ...payment, ...data, status, updatedAt: new Date(Date.now() + sequence++) };
        if (status === 'paid') {
          void prisma.order.update({ where: { id: order.id }, data: { status: 'paid' } });
        }
        return Promise.resolve(payment);
      }),
    };

    return {
      prisma,
      lifecycle,
      service: new PaymentService(
        prisma as unknown as PrismaService,
        lifecycle as unknown as OrderLifecycleService,
      ),
      getPayment: () => payment,
    };
  }

  afterEach(() => jest.restoreAllMocks());

  it('persists PagBank Order ID in providerRef and Charge ID in providerId', async () => {
    const { service, getPayment } = harness();
    jest
      .spyOn(PagbankProvider.prototype, 'createCardPayment')
      .mockResolvedValue(providerResult('pending'));

    await service.createPayment(
      { orderId: order.id, method: 'card', cardToken: 'encrypted-card' },
      customer.id,
    );

    expect(getPayment()).toMatchObject({ providerRef: 'ORDE_123', providerId: 'CHAR_123' });
  });

  it('persists the PagBank Order ID for PIX while keeping Charge ID null', async () => {
    const { service, lifecycle, getPayment } = harness();
    const expiration = '2026-08-10T18:00:00.000Z';
    jest.spyOn(PagbankProvider.prototype, 'createPixPayment').mockResolvedValue({
      ...providerResult('pending'),
      providerId: null,
      qrCode: 'https://example.test/qr.png',
      qrCodeText: 'pix-copy-and-paste',
      qrCodeExpiration: expiration,
    });

    await service.createPayment({ orderId: order.id, method: 'pix' }, customer.id);

    expect(getPayment()).toMatchObject({
      providerRef: 'ORDE_123',
      providerId: null,
      qrCode: 'https://example.test/qr.png',
      qrCodeText: 'pix-copy-and-paste',
    });
    expect(lifecycle.applyPaymentStatus).toHaveBeenCalledWith(
      'payment-123',
      'pending',
      expect.any(Object),
      new Date(expiration),
    );
  });

  it.each([
    ['paid', 'paid'],
    ['failed', 'failed'],
    ['pending', 'pending'],
  ] as const)('persists synchronous provider state %s as %s', async (providerStatus, expected) => {
    const { service, prisma, getPayment } = harness();
    jest
      .spyOn(PagbankProvider.prototype, 'createCardPayment')
      .mockResolvedValue(providerResult(providerStatus));

    await service.createPayment(
      { orderId: order.id, method: 'card', cardToken: 'encrypted-card' },
      customer.id,
    );

    expect(getPayment()?.status).toBe(expected);
    expect(prisma.order.update).toHaveBeenCalledTimes(providerStatus === 'paid' ? 1 : 0);
  });

  it('allows only the local reservation winner to call PagBank concurrently', async () => {
    const { service } = harness();
    let resolveProvider!: (result: PagbankPaymentResult) => void;
    const providerPromise = new Promise<PagbankPaymentResult>((resolve) => {
      resolveProvider = resolve;
    });
    const createPix = jest
      .spyOn(PagbankProvider.prototype, 'createPixPayment')
      .mockReturnValue(providerPromise);

    const winner = service.createPayment({ orderId: order.id, method: 'pix' }, customer.id);
    await Promise.resolve();
    const concurrent = await service.createPayment(
      { orderId: order.id, method: 'pix' },
      customer.id,
    );

    expect(concurrent.status).toBe('processing');
    expect(createPix).toHaveBeenCalledTimes(1);

    resolveProvider({ ...providerResult('pending'), providerId: null });
    await winner;
  });

  it('keeps an uncertain timeout recoverable and retries with the exact same key', async () => {
    const { service, lifecycle, getPayment } = harness();
    const createPix = jest
      .spyOn(PagbankProvider.prototype, 'createPixPayment')
      .mockRejectedValueOnce({ isAxiosError: true, code: 'ECONNABORTED' })
      .mockResolvedValueOnce({ ...providerResult('pending'), providerId: null });

    await expect(
      service.createPayment({ orderId: order.id, method: 'pix' }, customer.id),
    ).rejects.toMatchObject({ code: 'ECONNABORTED' });
    expect(getPayment()?.status).toBe('pending');
    expect(lifecycle.applyPaymentStatus).toHaveBeenCalledWith('payment-123', 'pending');

    await service.createPayment({ orderId: order.id, method: 'pix' }, customer.id);

    expect(createPix).toHaveBeenCalledTimes(2);
    expect(createPix.mock.calls[0][0].idempotencyKey).toBe(
      createPix.mock.calls[1][0].idempotencyKey,
    );
  });

  it('releases the reservation after a definitive failure before a PagBank result', async () => {
    const { service, lifecycle } = harness();
    jest
      .spyOn(PagbankProvider.prototype, 'createPixPayment')
      .mockRejectedValue(new Error('definitive request rejection'));

    await expect(
      service.createPayment({ orderId: order.id, method: 'pix' }, customer.id),
    ).rejects.toThrow('definitive request rejection');
    expect(lifecycle.applyPaymentStatus).toHaveBeenCalledWith('payment-123', 'failed');
  });

  it('returns an existing completed Payment without another external request', async () => {
    const { service } = harness();
    const createPix = jest
      .spyOn(PagbankProvider.prototype, 'createPixPayment')
      .mockResolvedValue({ ...providerResult('pending'), providerId: null });

    const first = await service.createPayment({ orderId: order.id, method: 'pix' }, customer.id);
    const retry = await service.createPayment({ orderId: order.id, method: 'pix' }, customer.id);

    expect(retry.id).toBe(first.id);
    expect(createPix).toHaveBeenCalledTimes(1);
  });

  it('does not regress a paid payment when a later WAITING webhook arrives', async () => {
    const { service, getPayment } = harness();
    jest
      .spyOn(PagbankProvider.prototype, 'createCardPayment')
      .mockResolvedValue(providerResult('paid'));
    await service.createPayment(
      { orderId: order.id, method: 'card', cardToken: 'encrypted-card' },
      customer.id,
    );

    await service.confirmWebhook({
      id: 'ORDE_123',
      reference_id: order.id,
      charges: [{ id: 'CHAR_123', status: 'WAITING' }],
    });

    expect(getPayment()).toMatchObject({
      status: 'paid',
      providerRef: 'ORDE_123',
      providerId: 'CHAR_123',
    });
  });
});
