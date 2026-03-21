import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { UploadModule } from './upload/upload.module';
import { AdminModule } from './admin/admin.module';
import { AddressModule } from './address/address.module';
import { CustomerModule } from './customer/customer.module';
import { PaymentModule } from './payment/payment.module';
import { ShippingModule } from './shipping/shipping.module';
import { SearchModule } from './search/search.module';
import { MediaModule } from './media/media.module';
import { CouponsModule } from './coupons/coupons.module';
import { WeeklyBestSellersModule } from './weekly-best-sellers/weekly-best-sellers.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    UploadModule,
    AdminModule,
    AddressModule,
    CustomerModule,
    PaymentModule,
    ShippingModule,
    SearchModule,
    MediaModule,
    CouponsModule,
    WeeklyBestSellersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
