import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  createPagbankIdempotencyKey,
  PagbankProvider,
  type PagbankOrderResult,
  type PagbankPaymentResult,
} from './pagbank.provider';
import { PaymentService, type ProviderEventOutcome } from './payment.service';

const RECONCILIATION_COOLDOWN_MS = 30_000;

@Injectable()
export class PaymentReconciliationService {
  private readonly pagbank = new PagbankProvider();

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  private async audit(
    paymentId: string,
    type: string,
    message: string,
    payload: Prisma.InputJsonObject,
  ) {
    await this.prisma.paymentLog.create({
      data: { paymentId, type, message, rawPayload: payload },
    });
  }

  private async hasUnknownCreateOutcome(paymentId: string) {
    const latestFailure = await this.prisma.paymentLog.findFirst({
      where: { paymentId, type: 'PROVIDER_REQUEST_FAILED' },
      orderBy: { createdAt: 'desc' },
    });
    const payload = latestFailure?.rawPayload;
    return (
      typeof payload === 'object' &&
      payload !== null &&
      !Array.isArray(payload) &&
      (payload as Record<string, unknown>).outcomeUnknown === true
    );
  }

  private async applyResult(
    paymentId: string,
    result: PagbankOrderResult | PagbankPaymentResult,
    localOrderId: string,
  ): Promise<ProviderEventOutcome> {
    const expiration = result.qrCodeExpiration ? new Date(result.qrCodeExpiration) : null;
    return this.paymentService.processProviderEvent(
      paymentId,
      result.status,
      {
        source: 'reconciliation',
        providerStatus: 'providerStatus' in result ? result.providerStatus : result.status,
        providerOrderId: result.providerRef,
        providerChargeId: result.providerId,
        referenceId: 'referenceId' in result ? result.referenceId : localOrderId,
        amountCents: result.providerAmountCents,
        currency: 'currency' in result ? result.currency : 'BRL',
      },
      {
        qrCode: result.qrCode,
        qrCodeText: result.qrCodeText,
        cardLast4: result.cardLast4,
        cardBrand: result.cardBrand,
      },
      expiration && !Number.isNaN(expiration.getTime()) ? expiration : null,
    );
  }

  async reconcileOrder(orderId: string, authenticatedCustomerId?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: { order: { include: { customer: true } } },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (authenticatedCustomerId && payment.order.customerId !== authenticatedCustomerId) {
      throw new ForbiddenException('Order does not belong to authenticated customer');
    }
    if (payment.provider !== 'pagbank') {
      throw new ForbiddenException('Payment provider is not supported for reconciliation');
    }

    const claimed = await this.prisma.payment.updateMany({
      where: {
        id: payment.id,
        updatedAt: { lte: new Date(Date.now() - RECONCILIATION_COOLDOWN_MS) },
      },
      data: { updatedAt: new Date() },
    });
    if (claimed.count === 0) {
      return {
        status: payment.status,
        outcome: 'throttled',
        reason: 'reconciliation_cooldown',
        providerRef: payment.providerRef,
        providerId: payment.providerId,
      };
    }

    const startedAt = Date.now();
    await this.audit(payment.id, 'RECONCILIATION_STARTED', 'PagBank reconciliation started', {
      orderId,
      providerRef: payment.providerRef,
      providerId: payment.providerId,
    });

    try {
      let result: PagbankOrderResult | PagbankPaymentResult;
      if (payment.providerRef) {
        result = await this.pagbank.getOrder(payment.providerRef);
      } else {
        const outcomeUnknown = await this.hasUnknownCreateOutcome(payment.id);
        if (!outcomeUnknown || payment.method !== 'pix') {
          const reason = outcomeUnknown
            ? 'card_retry_requires_original_encrypted_token'
            : 'provider_ref_missing_without_unknown_outcome';
          await this.audit(
            payment.id,
            'RECONCILIATION_MANUAL_REVIEW',
            'Payment cannot be reconciled automatically without providerRef',
            { orderId, reason },
          );
          return {
            status: payment.status,
            outcome: 'manual_review',
            reason,
            providerRef: null,
            providerId: payment.providerId,
          };
        }

        const customer = payment.order.customer;
        result = await this.pagbank.createPixPayment({
          referenceId: orderId,
          amountInCents: Math.round(payment.order.total * 100),
          description: `Pedido ${orderId}`,
          idempotencyKey: createPagbankIdempotencyKey(orderId, 'pix'),
          expirationDate: new Date(
            payment.order.createdAt.getTime() + 2 * 60 * 60 * 1000,
          ).toISOString(),
          customer: {
            name: `${customer.name} ${customer.surname}`,
            email: customer.email,
            tax_id: customer.cpf ?? '',
            phone: customer.phone,
          },
        });
      }

      const transition = await this.applyResult(payment.id, result, orderId);
      const auditType =
        transition.outcome === 'processed'
          ? 'RECONCILIATION_SUCCEEDED'
          : transition.outcome === 'manual_review' || transition.outcome === 'ignored'
            ? 'RECONCILIATION_MANUAL_REVIEW'
            : 'RECONCILIATION_NO_CHANGE';
      await this.audit(payment.id, auditType, 'PagBank reconciliation completed', {
        orderId,
        providerRef: result.providerRef,
        providerId: result.providerId,
        status: result.status,
        outcome: transition.outcome,
        reason: transition.reason,
        durationMs: Date.now() - startedAt,
      });
      return {
        status: transition.payment.status,
        outcome: transition.outcome,
        reason: transition.reason,
        providerRef: transition.payment.providerRef,
        providerId: transition.payment.providerId,
      };
    } catch (error: unknown) {
      const axiosError =
        typeof error === 'object' && error !== null && 'isAxiosError' in error
          ? (error as { response?: { status?: number } })
          : null;
      const httpStatus = axiosError?.response?.status ?? null;
      const reason =
        httpStatus === 404
          ? 'provider_order_not_found'
          : httpStatus === 401 || httpStatus === 403
            ? 'provider_authentication_failed'
            : httpStatus === 408 || httpStatus === 429 || (httpStatus !== null && httpStatus >= 500)
              ? 'provider_temporarily_unavailable'
              : axiosError && !axiosError.response
                ? 'provider_network_error'
                : 'provider_request_failed';
      const manualReview = httpStatus === 404 || httpStatus === 401 || httpStatus === 403;
      await this.audit(
        payment.id,
        manualReview ? 'RECONCILIATION_MANUAL_REVIEW' : 'RECONCILIATION_FAILED',
        'PagBank reconciliation did not change financial state',
        {
          orderId,
          providerRef: payment.providerRef,
          httpStatus,
          reason,
          durationMs: Date.now() - startedAt,
        },
      );
      return {
        status: payment.status,
        outcome: manualReview ? 'manual_review' : 'unavailable',
        reason,
        providerRef: payment.providerRef,
        providerId: payment.providerId,
      };
    }
  }
}
