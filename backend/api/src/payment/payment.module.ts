import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './providers/payment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { PaymentReconciliationService } from './providers/payment-reconciliation.service';

@Module({
  imports: [PrismaModule, AuthModule, OrdersModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentReconciliationService],
  exports: [PaymentService, PaymentReconciliationService],
})
export class PaymentModule {}
