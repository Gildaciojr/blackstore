import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateAdminProductDto } from './dto/create-admin-product.dto';
import { UpdateAdminProductDto } from './dto/update-admin-product.dto';

import { AdminJwtGuard } from './guards/admin-jwt.guard';

@Controller('admin/products')
@UseGuards(AdminJwtGuard)
export class AdminProductsController {
  constructor(private prisma: PrismaService) {}

  @Post()
  create(@Body() dto: CreateAdminProductDto) {
    return this.prisma.product.create({
      data: dto,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
