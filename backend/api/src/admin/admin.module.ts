import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminProductsController } from './admin-products.controller';
import { AdminCategoriesController } from './admin-categories.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminAuthController } from './admin-auth.controller';
import { AdminCustomersController } from './admin-customers.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminProductsController,
    AdminCategoriesController,
    AdminOrdersController,
    AdminDashboardController,
    AdminAuthController,
    AdminCustomersController,
  ],
})
export class AdminModule {}
