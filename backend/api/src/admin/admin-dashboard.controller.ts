import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminJwtGuard } from './guards/admin-jwt.guard';

@Controller('admin/dashboard')
@UseGuards(AdminJwtGuard)
export class AdminDashboardController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async stats() {
    const products = await this.prisma.product.count();
    const orders = await this.prisma.order.count();
    const customers = await this.prisma.customer.count();
    const categories = await this.prisma.category.count();
    const coupons = await this.prisma.coupon.count(); // 🔥 NOVO

    const revenue = await this.prisma.order.aggregate({
      _sum: {
        total: true,
      },
    });

    const growth = 12;

    return {
      products,
      orders,
      customers,
      categories,
      coupons, // 🔥 NOVO
      revenue: revenue._sum.total || 0,
      growth,
    };
  }
}
