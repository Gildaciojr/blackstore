import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { WebhookPaymentDto } from './dto/webhook-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async createPayment(data: CreatePaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId: data.orderId,
        method: data.method,
        status: 'pending',
        amount: order.total,
      },
    });

    return payment;
  }

  async confirmWebhook(data: WebhookPaymentDto) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        providerId: data.providerId,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: data.status,
      },
    });

    if (data.status === 'approved') {
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
