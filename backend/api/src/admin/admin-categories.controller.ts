import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateAdminCategoryDto } from './dto/create-admin-category.dto';
import { UpdateAdminCategoryDto } from './dto/update-admin-category.dto';

import { AdminJwtGuard } from './guards/admin-jwt.guard';

@Controller('admin/categories')
@UseGuards(AdminJwtGuard)
export class AdminCategoriesController {
  constructor(private prisma: PrismaService) {}

  @Post()
  create(@Body() dto: CreateAdminCategoryDto) {
    return this.prisma.category.create({
      data: dto,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
