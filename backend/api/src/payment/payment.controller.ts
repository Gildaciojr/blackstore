import { Controller, Post, Get, Param, Body, ForbiddenException, Req } from '@nestjs/common';
import type { Request } from 'express';
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
   * 🔥 WEBHOOK PAGBANK (SEM VALIDAÇÃO GLOBAL)
   */
  @Post('webhook/:secret')
  webhook(
    @Param('secret') secret: string,
    @Req() req: Request, // 👈 pega payload bruto
  ) {
    const expected = process.env.PAGBANK_WEBHOOK_SECRET;

    if (!expected || secret !== expected) {
      throw new ForbiddenException('Invalid webhook access');
    }

    /**
     * 🔥 IGNORA ValidationPipe GLOBAL
     * pega body bruto direto
     */
    const data = req.body as WebhookPaymentDto;

    return this.paymentService.confirmWebhook(data);
  }

  @Get(':orderId')
  getPayment(@Param('orderId') orderId: string) {
    return this.paymentService.getPayment(orderId);
  }
}
