import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { WebhookPaymentDto } from '../dto/webhook-payment.dto';
import { PagbankProvider } from './pagbank.provider';
import { Payment } from '@prisma/client';

type ProviderData = {
  providerId: string | null;
  qrCode: string | null;
  qrCodeText: string | null;
  cardLast4?: string | null;
  cardBrand?: string | null;
};

@Injectable()
export class PaymentService {
  private pagbank = new PagbankProvider();

  constructor(private prisma: PrismaService) {}

  async createPayment(data: CreatePaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const existing = await this.prisma.payment.findUnique({
      where: { orderId: data.orderId },
    });

    if (existing) {
      return existing;
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: order.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    let providerData: ProviderData | null = null;

    /**
     * =========================
     * PIX
     * =========================
     */
    if (data.method === 'pix') {
      providerData = await this.pagbank.createPixPayment({
        referenceId: order.id,
        amount: order.total,
        description: `Pedido ${order.id}`,
        customer: {
          name: `${customer.name} ${customer.surname}`,
          email: customer.email,
        },
      });
    }

    /**
     * =========================
     * CARTÃO REAL
     * =========================
     */
    if (data.method === 'card') {
      if (!data.cardToken) {
        throw new BadRequestException('Token do cartão é obrigatório');
      }

      providerData = await this.pagbank.createCardPayment({
        referenceId: order.id,
        amount: order.total,
        description: `Pedido ${order.id}`,
        customer: {
          name: `${customer.name} ${customer.surname}`,
          email: customer.email,
        },
        cardToken: data.cardToken,
        installments: data.installments ?? 1,
        holderName: data.holderName ?? customer.name,
      });
    }

    /**
     * =========================
     * CRIA PAYMENT
     * =========================
     */
    const payment = await this.prisma.payment.create({
      data: {
        orderId: data.orderId,
        method: data.method,
        status: 'pending',
        amount: order.total,
        provider: 'pagbank',
        providerId: providerData?.providerId ?? null,
        qrCode: providerData?.qrCode ?? null,
        qrCodeText: providerData?.qrCodeText ?? null,

        cardLast4: providerData?.cardLast4 ?? null,
        cardBrand: providerData?.cardBrand ?? null,
        cardHolderName: data.holderName ?? null,
        installments: data.installments ?? null,

        // mantém compatibilidade com schema
        cardExpMonth: null,
        cardExpYear: null,
      },
    });

    return payment;
  }

  /**
   * =========================
   * WEBHOOK (BLINDADO)
   * =========================
   */
  async confirmWebhook(data: WebhookPaymentDto) {
    const charge = data.charges?.[0];

    const providerId = charge?.id ?? data.id ?? null;

    const referenceId = data.reference_id ?? null;

    if (!providerId && !referenceId) {
      throw new BadRequestException('Invalid webhook payload');
    }

    let payment: Payment | null = null;

    /**
     * 🔥 PRIORIDADE 1: providerId (mais confiável)
     */
    if (providerId) {
      payment = await this.prisma.payment.findFirst({
        where: { providerId },
      });
    }

    /**
     * 🔥 PRIORIDADE 2: fallback por orderId
     */
    if (!payment && referenceId) {
      payment = await this.prisma.payment.findUnique({
        where: { orderId: referenceId },
      });
    }

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const rawStatus = charge?.status ?? (data as any)?.status ?? 'WAITING';

    let status: 'pending' | 'paid' | 'failed' = 'pending';

    /**
     * 🔥 NORMALIZAÇÃO DE STATUS (ROBUSTA)
     */
    if (rawStatus === 'PAID') {
      status = 'paid';
    } else if (rawStatus === 'DECLINED' || rawStatus === 'CANCELED' || rawStatus === 'CANCELLED') {
      status = 'failed';
    } else if (rawStatus === 'IN_ANALYSIS' || rawStatus === 'WAITING') {
      status = 'pending';
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        providerRef: referenceId ?? null,
      },
    });

    /**
     * 🔥 ATUALIZA PEDIDO (CRÍTICO)
     */
    if (status === 'paid') {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'paid',
        },
      });
    }

    return { success: true };
  }

  async getPayment(orderId: string) {
    return this.prisma.payment.findFirst({
      where: { orderId },
    });
  }
}
