import { Controller, Post, Get, Param, Body, ForbiddenException } from '@nestjs/common';
import { PaymentService } from './providers/payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { WebhookPaymentDto } from './dto/webhook-payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post()
  create(@Body() data: CreatePaymentDto) {
    return this.paymentService.createPayment(data);
  }

  /**
   * 🔥 WEBHOOK SEGURO (URL + SECRET)
   */
  @Post('webhook/:secret')
  webhook(@Param('secret') secret: string, @Body() data: WebhookPaymentDto) {
    const expected = process.env.PAGBANK_WEBHOOK_SECRET;

    if (!expected || secret !== expected) {
      throw new ForbiddenException('Invalid webhook access');
    }

    return this.paymentService.confirmWebhook(data);
  }

  @Get(':orderId')
  getPayment(@Param('orderId') orderId: string) {
    return this.paymentService.getPayment(orderId);
  }
}
