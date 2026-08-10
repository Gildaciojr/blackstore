import {
  InternalServerErrorException,
  UnauthorizedException,
  type RawBodyRequest,
} from '@nestjs/common';
import { createHash } from 'crypto';
import type { Request } from 'express';
import { PaymentController } from './payment.controller';
import type { PaymentService } from './providers/payment.service';
import type { PaymentReconciliationService } from './providers/payment-reconciliation.service';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AdminJwtGuard } from '../admin/guards/admin-jwt.guard';
import { CustomerJwtGuard } from '../auth/customer-jwt.guard';

describe('PaymentController webhook authentication', () => {
  const originalPagbankToken = process.env.PAGBANK_TOKEN;
  const originalWebhookSecret = process.env.PAGBANK_WEBHOOK_SECRET;
  const confirmWebhook = jest.fn();
  let controller: PaymentController;

  beforeEach(() => {
    process.env.PAGBANK_TOKEN = 'pagbank-account-token';
    process.env.PAGBANK_WEBHOOK_SECRET = 'webhook-url-secret';
    confirmWebhook.mockReset().mockReturnValue({ success: true });
    controller = new PaymentController(
      { confirmWebhook } as unknown as PaymentService,
      {} as PaymentReconciliationService,
    );
  });

  afterAll(() => {
    if (originalPagbankToken === undefined) delete process.env.PAGBANK_TOKEN;
    else process.env.PAGBANK_TOKEN = originalPagbankToken;

    if (originalWebhookSecret === undefined) delete process.env.PAGBANK_WEBHOOK_SECRET;
    else process.env.PAGBANK_WEBHOOK_SECRET = originalWebhookSecret;
  });

  function signature(rawBody: Buffer) {
    return createHash('sha256')
      .update(process.env.PAGBANK_TOKEN as string)
      .update('-')
      .update(rawBody)
      .digest('hex');
  }

  it('keeps customer and admin guards on reconciliation endpoints', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(Reflect.getMetadata(GUARDS_METADATA, PaymentController.prototype.reconcile)).toContain(
      CustomerJwtGuard,
    );
    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Reflect.getMetadata(GUARDS_METADATA, PaymentController.prototype.reconcileAsAdmin),
    ).toContain(AdminJwtGuard);
  });

  function request(rawBody: Buffer | undefined, body: object, authenticityToken?: string) {
    return {
      rawBody,
      body,
      get: (header: string) =>
        header.toLowerCase() === 'x-authenticity-token' ? authenticityToken : undefined,
    } as unknown as RawBodyRequest<Request>;
  }

  it('accepts a webhook with URL secret and valid official signature', () => {
    const body = { reference_id: 'order-1', charges: [{ id: 'charge-1', status: 'PAID' }] };
    const rawBody = Buffer.from(JSON.stringify(body));

    expect(
      controller.webhook('webhook-url-secret', request(rawBody, body, signature(rawBody))),
    ).toEqual({ success: true });
    expect(confirmWebhook).toHaveBeenCalledWith(body);
  });

  it('rejects a webhook without x-authenticity-token', () => {
    const body = { reference_id: 'order-1' };
    const rawBody = Buffer.from(JSON.stringify(body));

    expect(() => controller.webhook('webhook-url-secret', request(rawBody, body))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an incorrect signature even when the URL secret is correct', () => {
    const body = { reference_id: 'order-1' };
    const rawBody = Buffer.from(JSON.stringify(body));

    expect(() =>
      controller.webhook('webhook-url-secret', request(rawBody, body, '0'.repeat(64))),
    ).toThrow(UnauthorizedException);
    expect(confirmWebhook).not.toHaveBeenCalled();
  });

  it('uses the original raw body instead of JSON.stringify(req.body)', () => {
    const body = { reference_id: 'order-1', status: 'WAITING' };
    const rawBody = Buffer.from('{\n  "reference_id": "order-1",\n  "status": "WAITING"\n}');
    const reserializedBody = Buffer.from(JSON.stringify(body));

    expect(
      controller.webhook('webhook-url-secret', request(rawBody, body, signature(rawBody))),
    ).toEqual({ success: true });
    expect(() =>
      controller.webhook('webhook-url-secret', request(rawBody, body, signature(reserializedBody))),
    ).toThrow(UnauthorizedException);
  });

  it('rejects safely when PAGBANK_TOKEN is not configured', () => {
    const body = { reference_id: 'order-1' };
    const rawBody = Buffer.from(JSON.stringify(body));
    delete process.env.PAGBANK_TOKEN;

    expect(() =>
      controller.webhook('webhook-url-secret', request(rawBody, body, '0'.repeat(64))),
    ).toThrow(InternalServerErrorException);
  });
});
