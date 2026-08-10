import axios from 'axios';
import { createPagbankIdempotencyKey, PagbankProvider } from './pagbank.provider';

describe('PagbankProvider contract', () => {
  const originalToken = process.env.PAGBANK_TOKEN;
  const originalApiUrl = process.env.API_URL;
  const originalWebhookSecret = process.env.PAGBANK_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.PAGBANK_TOKEN = 'sandbox-token';
    process.env.API_URL = 'https://api.example.test';
    process.env.PAGBANK_WEBHOOK_SECRET = 'webhook-secret';
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (originalToken === undefined) delete process.env.PAGBANK_TOKEN;
    else process.env.PAGBANK_TOKEN = originalToken;
    if (originalApiUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = originalApiUrl;
    if (originalWebhookSecret === undefined) delete process.env.PAGBANK_WEBHOOK_SECRET;
    else process.env.PAGBANK_WEBHOOK_SECRET = originalWebhookSecret;
  });

  const common = {
    referenceId: 'order-123',
    amountInCents: 1099,
    description: 'Pedido order-123',
    idempotencyKey: createPagbankIdempotencyKey('order-123', 'pix'),
    customer: {
      name: 'Cliente Teste',
      email: 'customer@example.test',
      tax_id: '123.456.789-01',
      phone: '11999999999',
    },
  };

  it('sends the official top-level PIX qr_codes payload and parses its response', async () => {
    const post = jest.spyOn(axios, 'post').mockResolvedValue({
      status: 201,
      statusText: 'Created',
      headers: {},
      config: { url: 'https://sandbox.api.pagseguro.com/orders' },
      data: {
        id: 'ORDE_PIX',
        qr_codes: [
          {
            id: 'QRCO_PIX',
            expiration_date: '2026-08-10T12:00:00-03:00',
            text: 'pix-copy-and-paste',
            amount: { value: 1099 },
            links: [
              {
                rel: 'QRCODE.PNG',
                href: 'https://example.test/qr.png',
                media: 'image/png',
              },
            ],
          },
        ],
        charges: [],
      },
    });

    const result = await new PagbankProvider().createPixPayment(common);
    const [, payload, config] = post.mock.calls[0];

    expect(payload).toMatchObject({
      reference_id: 'order-123',
      items: [{ reference_id: 'order-123', unit_amount: 1099 }],
      qr_codes: [{ amount: { value: 1099 }, expiration_date: expect.any(String) }],
    });
    expect(payload).not.toHaveProperty('charges');
    expect(config?.headers?.['x-idempotency-key']).toBe(common.idempotencyKey);
    expect(result).toMatchObject({
      providerRef: 'ORDE_PIX',
      providerId: null,
      qrCode: 'https://example.test/qr.png',
      qrCodeText: 'pix-copy-and-paste',
      qrCodeId: 'QRCO_PIX',
      qrCodeExpiration: '2026-08-10T12:00:00-03:00',
      providerAmountCents: 1099,
    });
  });

  it.each([
    ['PAID', 'paid'],
    ['DECLINED', 'failed'],
    ['IN_ANALYSIS', 'pending'],
    ['WAITING', 'pending'],
    ['AUTHORIZED', 'pending'],
    ['CANCELED', 'failed'],
  ] as const)('maps synchronous card status %s to %s', async (pagbankStatus, expected) => {
    const post = jest.spyOn(axios, 'post').mockResolvedValue({
      status: 201,
      statusText: 'Created',
      headers: {},
      config: { url: 'https://sandbox.api.pagseguro.com/orders' },
      data: {
        id: 'ORDE_CARD',
        charges: [
          {
            id: 'CHAR_CARD',
            status: pagbankStatus,
            amount: { value: 1099, currency: 'BRL' },
            payment_method: { card: { last_digits: '1111', brand: 'visa' } },
          },
        ],
      },
    });
    const idempotencyKey = createPagbankIdempotencyKey('order-123', 'card');

    const result = await new PagbankProvider().createCardPayment({
      ...common,
      idempotencyKey,
      cardToken: 'encrypted-card',
      installments: 3,
      holderName: 'Cliente Teste',
    });
    const [, payload, config] = post.mock.calls[0];
    const paymentMethod = payload.charges[0].payment_method;

    expect(paymentMethod).toEqual({
      type: 'CREDIT_CARD',
      capture: true,
      installments: 3,
      card: { encrypted: 'encrypted-card' },
      holder: { name: 'Cliente Teste', tax_id: '12345678901' },
    });
    expect(payload.items[0].unit_amount).toBe(1099);
    expect(payload.charges[0].amount.value).toBe(1099);
    expect(config?.headers?.['x-idempotency-key']).toBe(idempotencyKey);
    expect(result).toMatchObject({
      providerRef: 'ORDE_CARD',
      providerId: 'CHAR_CARD',
      status: expected,
      providerAmountCents: 1099,
      cardLast4: '1111',
      cardBrand: 'visa',
    });
  });

  it('derives one stable alphanumeric idempotency key per Order and method', () => {
    const first = createPagbankIdempotencyKey('order-123', 'pix');
    const retry = createPagbankIdempotencyKey('order-123', 'pix');

    expect(first).toBe(retry);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toBe(createPagbankIdempotencyKey('order-123', 'card'));
  });

  it('gets and normalizes a PagBank Order for reconciliation', async () => {
    const get = jest.spyOn(axios, 'get').mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: 'https://sandbox.api.pagseguro.com/orders/ORDE_GET' },
      data: {
        id: 'ORDE_GET',
        reference_id: 'order-123',
        charges: [
          {
            id: 'CHAR_GET',
            status: 'PAID',
            amount: { value: 1099, currency: 'BRL' },
            payment_method: { card: { last_digits: '1111', brand: 'visa' } },
          },
        ],
      },
    });

    const result = await new PagbankProvider().getOrder('ORDE_GET');

    expect(get).toHaveBeenCalledWith(
      'https://sandbox.api.pagseguro.com/orders/ORDE_GET',
      expect.objectContaining({
        timeout: 15000,
        headers: expect.objectContaining({ Accept: 'application/json' }),
      }),
    );
    expect(result).toMatchObject({
      providerRef: 'ORDE_GET',
      providerId: 'CHAR_GET',
      referenceId: 'order-123',
      providerStatus: 'PAID',
      status: 'paid',
      providerAmountCents: 1099,
      currency: 'BRL',
    });
  });
});
