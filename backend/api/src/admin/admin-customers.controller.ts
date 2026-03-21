import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminJwtGuard } from './guards/admin-jwt.guard';

@Controller('admin/customers')
@UseGuards(AdminJwtGuard)
export class AdminCustomersController {
  constructor(private prisma: PrismaService) {}

  /**
   * LISTAR CLIENTES
   */
  @Get()
  async findAll() {
    const customers = await this.prisma.customer.findMany({
      include: {
        orders: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return customers.map((customer) => {
      const totalSpent = customer.orders.reduce((acc, order) => acc + order.total, 0);

      return {
        ...customer,
        ordersCount: customer.orders.length,
        totalSpent,
      };
    });
  }

  /**
   * DETALHE DO CLIENTE
   */
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });
  }
}
