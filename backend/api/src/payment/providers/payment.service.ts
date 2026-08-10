import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Payment } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderLifecycleService } from '../../orders/order-lifecycle.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { WebhookPaymentDto } from '../dto/webhook-payment.dto';
import {
  createPagbankIdempotencyKey,
  isSupportedPagbankStatus,
  isPagbankResultUnknown,
  mapPagbankStatus,
  PagbankProvider,
  type PagbankPaymentResult,
  type PagbankPaymentStatus,
} from './pagbank.provider';
import { decidePaymentTransition } from './payment-state-machine';

const PROCESSING_LEASE_MS = 30_000;

export function amountToCents(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new BadRequestException('Invalid order amount');
  }

  const amountInCents = Math.round((amount + Number.EPSILON) * 100);

  if (!Number.isInteger(amountInCents) || amountInCents <= 0) {
    throw new BadRequestException('Invalid order amount');
  }

  return amountInCents;
}

export type ProviderEventSource = 'synchronous' | 'webhook' | 'reconciliation';

export type ProviderEventContext = {
  source: ProviderEventSource;
  providerStatus: string;
  providerOrderId: string | null;
  providerChargeId: string | null;
  referenceId: string | null;
  amountCents: number | null;
  currency: string | null;
};

export type ProviderPaymentData = {
  qrCode?: string | null;
  qrCodeText?: string | null;
  cardLast4?: string | null;
  cardBrand?: string | null;
};

export type ProviderEventOutcome = {
  payment: Payment;
  outcome: 'processed' | 'duplicate' | 'ignored' | 'manual_review';
  reason: string;
};

@Injectable()
export class PaymentService {
  private readonly pagbank = new PagbankProvider();

  constructor(
    private readonly prisma: PrismaService,
    private readonly orderLifecycle: OrderLifecycleService,
  ) {}

  private auditPayload(context: ProviderEventContext, extra: Record<string, unknown> = {}) {
    return {
      source: context.source,
      providerStatus: context.providerStatus,
      providerOrderId: context.providerOrderId,
      providerChargeId: context.providerChargeId,
      referenceId: context.referenceId,
      amountCents: context.amountCents,
      currency: context.currency,
      ...extra,
    } as Prisma.InputJsonObject;
  }

  private async audit(
    paymentId: string,
    type: string,
    message: string,
    payload?: Prisma.InputJsonObject,
  ) {
    await this.prisma.paymentLog.create({
      data: {
        paymentId,
        type,
        message,
        rawPayload: payload,
      },
    });
  }

  private identifierConflict(payment: Payment, context: ProviderEventContext): string | null {
    if (context.providerOrderId && !context.providerOrderId.startsWith('ORDE_')) {
      return 'provider_order_id_invalid';
    }
    if (context.providerChargeId && !context.providerChargeId.startsWith('CHAR_')) {
      return 'provider_charge_id_invalid';
    }
    if (context.referenceId && context.referenceId !== payment.orderId) {
      return 'reference_id_mismatch';
    }
    if (
      payment.providerRef &&
      context.providerOrderId &&
      payment.providerRef !== context.providerOrderId
    ) {
      return 'provider_order_id_mismatch';
    }
    if (
      payment.providerId &&
      context.providerChargeId &&
      payment.providerId !== context.providerChargeId
    ) {
      return 'provider_charge_id_mismatch';
    }
    return null;
  }

  private async claimMissingProviderIdentifiers(
    payment: Payment,
    context: ProviderEventContext,
  ): Promise<{ payment: Payment; conflict: string | null }> {
    let current = payment;
    const claims = [
      {
        field: 'providerRef' as const,
        value: context.providerOrderId,
        conflict: 'provider_order_id_mismatch',
      },
      {
        field: 'providerId' as const,
        value: context.providerChargeId,
        conflict: 'provider_charge_id_mismatch',
      },
    ];

    for (const claim of claims) {
      if (!claim.value || current[claim.field]) continue;
      const updated = await this.prisma.payment.updateMany({
        where: { id: current.id, [claim.field]: null },
        data: { [claim.field]: claim.value },
      });
      if (updated.count === 1) {
        current = { ...current, [claim.field]: claim.value };
        continue;
      }

      const winner = await this.prisma.payment.findUnique({ where: { id: current.id } });
      if (!winner || winner[claim.field] !== claim.value) {
        return { payment: winner ?? current, conflict: claim.conflict };
      }
      current = winner;
    }

    return { payment: current, conflict: null };
  }

  async processProviderEvent(
    paymentId: string,
    incomingStatus: PagbankPaymentStatus,
    context: ProviderEventContext,
    providerData: ProviderPaymentData = {},
    reservationExpiresAt?: Date | null,
  ): Promise<ProviderEventOutcome> {
    let payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });
    if (!payment) throw new ConflictException('Payment disappeared during provider event');

    const identifierConflict = this.identifierConflict(payment, context);
    if (identifierConflict) {
      await this.audit(
        payment.id,
        'STATUS_IGNORED',
        'Provider event rejected because identifiers are inconsistent',
        this.auditPayload(context, { reason: identifierConflict }),
      );
      return { payment, outcome: 'ignored', reason: identifierConflict };
    }

    const identifierClaim = await this.claimMissingProviderIdentifiers(payment, context);
    payment = { ...identifierClaim.payment, order: payment.order };
    if (identifierClaim.conflict) {
      await this.audit(
        payment.id,
        'STATUS_IGNORED',
        'Provider event lost an identifier claim to a contradictory event',
        this.auditPayload(context, { reason: identifierClaim.conflict }),
      );
      return { payment, outcome: 'ignored', reason: identifierClaim.conflict };
    }

    if (incomingStatus === 'paid') {
      const expectedAmountCents = amountToCents(payment.order.total);
      if (!Number.isInteger(context.amountCents)) {
        await this.audit(
          payment.id,
          'AMOUNT_MISMATCH',
          'PAID event ignored because provider amount is missing',
          this.auditPayload(context, { expectedAmountCents, reason: 'provider_amount_missing' }),
        );
        if (payment.status === 'processing') {
          await this.orderLifecycle.applyPaymentStatus(payment.id, 'pending', {
            providerRef: context.providerOrderId ?? payment.providerRef,
            providerId: context.providerChargeId ?? payment.providerId,
          });
        }
        return { payment, outcome: 'ignored', reason: 'provider_amount_missing' };
      }
      if (
        context.amountCents !== expectedAmountCents ||
        (context.currency !== null && context.currency !== 'BRL')
      ) {
        const reason =
          context.currency !== null && context.currency !== 'BRL'
            ? 'provider_currency_mismatch'
            : 'provider_amount_mismatch';
        await this.audit(
          payment.id,
          'AMOUNT_MISMATCH',
          'PAID event ignored because provider amount differs from Order total',
          this.auditPayload(context, { expectedAmountCents, reason }),
        );
        if (payment.status === 'processing') {
          await this.orderLifecycle.applyPaymentStatus(payment.id, 'pending', {
            providerRef: context.providerOrderId ?? payment.providerRef,
            providerId: context.providerChargeId ?? payment.providerId,
          });
        }
        return { payment, outcome: 'ignored', reason };
      }
    }

    const decision = decidePaymentTransition(payment.status, incomingStatus);
    if (decision.action !== 'apply') {
      const type =
        decision.action === 'duplicate' && context.source === 'webhook'
          ? 'WEBHOOK_DUPLICATE'
          : 'STATUS_IGNORED';
      await this.audit(
        payment.id,
        type,
        decision.action === 'manual_review'
          ? 'Provider event requires manual review'
          : 'Provider event produced no state transition',
        this.auditPayload(context, { reason: decision.reason, currentStatus: payment.status }),
      );
      return {
        payment,
        outcome:
          decision.action === 'manual_review'
            ? 'manual_review'
            : decision.action === 'ignore'
              ? 'ignored'
              : 'duplicate',
        reason: decision.reason,
      };
    }

    const updated = await this.orderLifecycle.applyPaymentStatus(
      payment.id,
      incomingStatus,
      {
        providerRef: context.providerOrderId ?? payment.providerRef,
        providerId: context.providerChargeId ?? payment.providerId,
        ...providerData,
      },
      reservationExpiresAt,
    );
    await this.audit(
      payment.id,
      'STATUS_TRANSITION',
      `Payment transitioned from ${payment.status} to ${incomingStatus}`,
      this.auditPayload(context, { from: payment.status, to: incomingStatus }),
    );
    if (incomingStatus === 'paid' || incomingStatus === 'failed') {
      await this.audit(
        payment.id,
        incomingStatus === 'paid' ? 'LIFECYCLE_COMMITTED' : 'LIFECYCLE_RELEASED',
        incomingStatus === 'paid'
          ? 'Order reservation committed atomically'
          : 'Order reservation released atomically',
        this.auditPayload(context),
      );
    }
    return { payment: updated, outcome: 'processed', reason: decision.reason };
  }

  private async reservePayment(
    order: { id: string; total: number },
    data: CreatePaymentDto,
  ): Promise<{ payment: Payment; claimed: boolean }> {
    try {
      const payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          method: data.method,
          status: 'processing',
          amount: order.total,
          provider: 'pagbank',
          cardHolderName: data.method === 'card' ? (data.holderName ?? null) : null,
          installments: data.method === 'card' ? (data.installments ?? 1) : null,
        },
      });

      return { payment, claimed: true };
    } catch (error: unknown) {
      if ((error as { code?: string }).code !== 'P2002') throw error;
    }

    const existing = await this.prisma.payment.findUnique({ where: { orderId: order.id } });

    if (!existing) {
      throw new ConflictException('Payment reservation conflict');
    }

    if (existing.method !== data.method) {
      throw new ConflictException('Order already has a payment with a different method');
    }

    if (
      existing.providerRef ||
      existing.providerId ||
      existing.qrCode ||
      existing.status === 'paid' ||
      existing.status === 'failed'
    ) {
      return { payment: existing, claimed: false };
    }

    const leaseIsActive =
      existing.status === 'processing' &&
      Date.now() - existing.updatedAt.getTime() < PROCESSING_LEASE_MS;

    if (leaseIsActive) {
      return { payment: existing, claimed: false };
    }

    const claim = await this.prisma.payment.updateMany({
      where: {
        id: existing.id,
        status: existing.status,
        updatedAt: existing.updatedAt,
        providerRef: null,
        providerId: null,
      },
      data: { status: 'processing' },
    });

    if (claim.count === 0) {
      const winner = await this.prisma.payment.findUnique({ where: { orderId: order.id } });
      if (!winner) throw new ConflictException('Payment reservation disappeared');
      return { payment: winner, claimed: false };
    }

    return { payment: { ...existing, status: 'processing', updatedAt: new Date() }, claimed: true };
  }

  private async persistProviderResult(payment: Payment, result: PagbankPaymentResult) {
    const parsedExpiration = result.qrCodeExpiration ? new Date(result.qrCodeExpiration) : null;
    const reservationExpiresAt =
      parsedExpiration && !Number.isNaN(parsedExpiration.getTime()) ? parsedExpiration : null;

    const outcome = await this.processProviderEvent(
      payment.id,
      result.status,
      {
        source: 'synchronous',
        providerStatus: result.status,
        providerOrderId: result.providerRef,
        providerChargeId: result.providerId,
        referenceId: payment.orderId,
        amountCents: result.providerAmountCents,
        currency: 'BRL',
      },
      {
        qrCode: result.qrCode,
        qrCodeText: result.qrCodeText,
        cardLast4: result.cardLast4,
        cardBrand: result.cardBrand,
      },
      reservationExpiresAt,
    );
    if (
      result.status === 'paid' &&
      outcome.outcome !== 'processed' &&
      outcome.outcome !== 'duplicate'
    ) {
      throw new ConflictException(`Provider PAID result requires review: ${outcome.reason}`);
    }
    return outcome.payment;
  }

  async createPayment(data: CreatePaymentDto, authenticatedCustomerId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: data.orderId } });

    if (!order) throw new NotFoundException('Order not found');
    if (order.customerId !== authenticatedCustomerId) {
      throw new ForbiddenException('Order does not belong to authenticated customer');
    }
    if (order.reservationStatus === 'RELEASED') {
      throw new ConflictException('Order reservation was already released');
    }
    if (!order.reservationStatus) {
      throw new ConflictException('Order reservation is not classified');
    }

    const amountInCents = amountToCents(order.total);

    if (data.method === 'card' && !data.cardToken) {
      throw new BadRequestException('Token do cartão é obrigatório');
    }

    const customer = await this.prisma.customer.findUnique({ where: { id: order.customerId } });

    if (!customer) throw new NotFoundException('Customer not found');
    if (!customer.cpf) {
      throw new BadRequestException('O cadastro do cliente está incompleto. CPF obrigatório.');
    }

    const reservation = await this.reservePayment(order, data);
    if (!reservation.claimed) return reservation.payment;

    const payment = reservation.payment;
    await this.audit(
      payment.id,
      'PAYMENT_CREATED',
      'Local Payment created before provider request',
      {
        source: 'synchronous',
        method: data.method,
        orderId: order.id,
        amountCents: amountInCents,
      },
    );
    const idempotencyKey = createPagbankIdempotencyKey(order.id, data.method);
    const common = {
      referenceId: order.id,
      amountInCents,
      description: `Pedido ${order.id}`,
      idempotencyKey,
      expirationDate: new Date(order.createdAt.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      customer: {
        name: `${customer.name} ${customer.surname}`,
        email: customer.email,
        tax_id: customer.cpf,
        phone: customer.phone,
      },
    };

    let result: PagbankPaymentResult;

    try {
      result =
        data.method === 'pix'
          ? await this.pagbank.createPixPayment(common)
          : await this.pagbank.createCardPayment({
              ...common,
              cardToken: data.cardToken as string,
              installments: data.installments ?? 1,
              holderName: data.holderName ?? `${customer.name} ${customer.surname}`,
            });
    } catch (error: unknown) {
      const unknownResult = isPagbankResultUnknown(error);
      await this.audit(
        payment.id,
        'PROVIDER_REQUEST_FAILED',
        unknownResult
          ? 'Provider outcome is unknown and remains recoverable'
          : 'Provider request failed definitively',
        { source: 'synchronous', outcomeUnknown: unknownResult },
      );
      await this.orderLifecycle.applyPaymentStatus(
        payment.id,
        unknownResult ? 'pending' : 'failed',
      );
      throw error;
    }

    await this.audit(payment.id, 'PROVIDER_REQUEST_ACCEPTED', 'Provider returned a response', {
      source: 'synchronous',
      providerStatus: result.status,
      providerOrderId: result.providerRef,
      providerChargeId: result.providerId,
      amountCents: result.providerAmountCents,
    });

    return this.persistProviderResult(payment, result);
  }

  async confirmWebhook(data: WebhookPaymentDto) {
    const charge = data.charges?.[0];
    const pagbankOrderId = data.id ?? null;
    const chargeId = charge?.id ?? null;
    const localOrderId = data.reference_id ?? null;
    const rawStatus = charge?.status ?? data.status;

    if (!pagbankOrderId && !chargeId && !localOrderId) {
      throw new BadRequestException('Invalid webhook payload');
    }
    if (!isSupportedPagbankStatus(rawStatus)) {
      throw new BadRequestException('Invalid webhook payment status');
    }

    let payment: Payment | null = null;

    if (chargeId) {
      payment = await this.prisma.payment.findFirst({ where: { providerId: chargeId } });
    }

    if (!payment && pagbankOrderId) {
      payment = await this.prisma.payment.findFirst({ where: { providerRef: pagbankOrderId } });
    }

    if (!payment && localOrderId) {
      payment = await this.prisma.payment.findUnique({ where: { orderId: localOrderId } });
    }

    if (!payment) throw new NotFoundException('Payment not found');

    const context: ProviderEventContext = {
      source: 'webhook',
      providerStatus: rawStatus as string,
      providerOrderId: pagbankOrderId,
      providerChargeId: chargeId,
      referenceId: localOrderId,
      amountCents: charge?.amount?.value ?? null,
      currency: charge?.amount?.currency ?? null,
    };
    await this.audit(
      payment.id,
      'WEBHOOK_RECEIVED',
      'Authenticated PagBank webhook received',
      this.auditPayload(context),
    );
    const result = await this.processProviderEvent(
      payment.id,
      mapPagbankStatus(rawStatus),
      context,
    );

    return { success: true, outcome: result.outcome, reason: result.reason };
  }

  async getPayment(orderId: string, authenticatedCustomerId: string) {
    return this.prisma.payment.findFirst({
      where: {
        orderId,
        order: { customerId: authenticatedCustomerId },
      },
    });
  }
}
