import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentService } from './providers/payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { WebhookPaymentDto } from './dto/webhook-payment.dto';
import { CustomerJwtGuard } from '../auth/customer-jwt.guard';
import { CurrentCustomer } from '../auth/current-customer.decorator';
import type { AuthenticatedCustomer } from '../auth/customer-jwt.guard';
import { secureStringEqual, verifyPagbankWebhookSignature } from './pagbank-webhook-signature';
import { PaymentReconciliationService } from './providers/payment-reconciliation.service';
import { AdminJwtGuard } from '../admin/guards/admin-jwt.guard';

@Controller('payment')
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private reconciliationService: PaymentReconciliationService,
  ) {}

  @Post()
  @UseGuards(CustomerJwtGuard)
  create(@Body() data: CreatePaymentDto, @CurrentCustomer() customer: AuthenticatedCustomer) {
    return this.paymentService.createPayment(data, customer.id);
  }

  /**
   * 🔥 WEBHOOK PAGBANK (SEM VALIDAÇÃO GLOBAL)
   */
  @Post('webhook/:secret')
  webhook(@Param('secret') secret: string, @Req() req: RawBodyRequest<Request>) {
    const expected = process.env.PAGBANK_WEBHOOK_SECRET;
    const pagbankToken = process.env.PAGBANK_TOKEN;

    if (!expected || !secureStringEqual(secret, expected)) {
      throw new ForbiddenException('Invalid webhook access');
    }

    if (!pagbankToken) {
      throw new InternalServerErrorException('Webhook authentication is not configured');
    }

    if (!req.rawBody) {
      throw new InternalServerErrorException('Webhook raw body is unavailable');
    }

    const authenticityToken = req.get('x-authenticity-token');

    if (
      !authenticityToken ||
      !verifyPagbankWebhookSignature(req.rawBody, authenticityToken, pagbankToken)
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const data = req.body as WebhookPaymentDto;

    return this.paymentService.confirmWebhook(data);
  }

  @Get(':orderId')
  @UseGuards(CustomerJwtGuard)
  getPayment(
    @Param('orderId') orderId: string,
    @CurrentCustomer() customer: AuthenticatedCustomer,
  ) {
    return this.paymentService.getPayment(orderId, customer.id);
  }

  @Post(':orderId/reconcile')
  @UseGuards(CustomerJwtGuard)
  reconcile(@Param('orderId') orderId: string, @CurrentCustomer() customer: AuthenticatedCustomer) {
    return this.reconciliationService.reconcileOrder(orderId, customer.id);
  }

  @Post(':orderId/reconcile/admin')
  @UseGuards(AdminJwtGuard)
  reconcileAsAdmin(@Param('orderId') orderId: string) {
    return this.reconciliationService.reconcileOrder(orderId);
  }
}
