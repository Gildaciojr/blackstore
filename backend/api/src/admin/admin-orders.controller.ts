import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminJwtGuard } from './guards/admin-jwt.guard';

@Controller('admin/orders')
@UseGuards(AdminJwtGuard)
export class AdminOrdersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  getAll() {
    return this.prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        address: true,
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        address: true,
        payment: true,
      },
    });
  }

  @Patch(':id/status/:status')
  updateStatus(@Param('id') id: string, @Param('status') status: string) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }
}
