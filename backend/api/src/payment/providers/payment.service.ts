import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { WebhookPaymentDto } from '../dto/webhook-payment.dto';
import { PagbankProvider } from './pagbank.provider';

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

    let providerData: ProviderData | null = null;

    if (data.method === 'pix') {
      providerData = await this.pagbank.createPixPayment({
        referenceId: order.id,
        amount: order.total,
        description: `Pedido ${order.id}`,
      });
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId: data.orderId,
        method: data.method,
        status: 'pending',
        amount: order.total,
        providerId: providerData ? providerData.providerId : null,
        qrCode: providerData ? providerData.qrCode : null,
        qrCodeText: providerData ? providerData.qrCodeText : null,
      },
    });

    return payment;
  }

  async confirmWebhook(data: WebhookPaymentDto) {
    const charge = data.charges?.[0];

    if (!charge) {
      throw new NotFoundException('Charge not found');
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        providerId: charge.id,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    /**
     * Mapear status PagBank → sistema
     */
    let status: 'pending' | 'approved' | 'failed' = 'pending';

    if (charge.status === 'PAID') {
      status = 'approved';
    }

    if (charge.status === 'DECLINED') {
      status = 'failed';
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
      },
    });

    /**
     * Se aprovado → atualizar pedido
     */
    if (status === 'approved') {
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
