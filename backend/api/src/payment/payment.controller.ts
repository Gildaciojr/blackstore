import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { WebhookPaymentDto } from './dto/webhook-payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post()
  create(@Body() data: CreatePaymentDto) {
    return this.paymentService.createPayment(data);
  }

  @Post('webhook')
  webhook(@Body() data: WebhookPaymentDto) {
    return this.paymentService.confirmWebhook(data);
  }

  @Get(':orderId')
  getPayment(@Param('orderId') orderId: string) {
    return this.paymentService.getPayment(orderId);
  }
}
