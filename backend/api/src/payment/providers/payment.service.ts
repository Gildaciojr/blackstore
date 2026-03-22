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

    let providerData: ProviderData | null = null;

    if (data.method === 'pix') {
      providerData = await this.pagbank.createPixPayment({
        referenceId: order.id,
        amount: order.total,
        description: `Pedido ${order.id}`,
      });
    }

    if (data.method === 'card') {
      providerData = {
        providerId: null,
        qrCode: null,
        qrCodeText: null,
      };
    }

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
      },
    });

    return payment;
  }

  /**
   * 🔥 WEBHOOK UNIVERSAL PAGBANK
   */
  async confirmWebhook(data: WebhookPaymentDto) {
    const charge = data.charges?.[0];

    const providerId = charge?.id ?? data.id ?? null;
    const referenceId = data.reference_id;

    if (!providerId && !referenceId) {
      throw new BadRequestException('Invalid webhook payload');
    }

    /**
     * =========================
     * TIPAGEM CORRETA (AQUI ERA O BUG)
     * =========================
     */
    let payment: Payment | null = null;

    if (providerId) {
      payment = await this.prisma.payment.findFirst({
        where: { providerId },
      });
    }

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

    if (rawStatus === 'PAID') status = 'paid';
    if (rawStatus === 'DECLINED' || rawStatus === 'CANCELED') status = 'failed';
    if (rawStatus === 'IN_ANALYSIS' || rawStatus === 'WAITING') status = 'pending';

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        providerRef: referenceId ?? null,
      },
    });

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
