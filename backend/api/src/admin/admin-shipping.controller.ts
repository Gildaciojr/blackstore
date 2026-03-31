import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminJwtGuard } from './guards/admin-jwt.guard';

@Controller('admin/shipping')
@UseGuards(AdminJwtGuard)
export class AdminShippingController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.shippingRate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  create(@Body() data: any) {
    return this.prisma.shippingRate.create({ data });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.prisma.shippingRate.update({
      where: { id },
      data,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prisma.shippingRate.delete({
      where: { id },
    });
  }
}
