import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateAdminProductDto } from './dto/create-admin-product.dto';
import { UpdateAdminProductDto } from './dto/update-admin-product.dto';

import { AdminJwtGuard } from './guards/admin-jwt.guard';

function generateSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

@Controller('admin/products')
@UseGuards(AdminJwtGuard)
export class AdminProductsController {
  constructor(private prisma: PrismaService) {}

  private async getUniqueSlug(baseSlug: string, ignoreId?: string) {
    let slug = generateSlug(baseSlug);
    let counter = 1;

    while (true) {
      const existing = await this.prisma.product.findFirst({
        where: ignoreId
          ? {
              slug,
              id: { not: ignoreId },
            }
          : { slug },
      });

      if (!existing) return slug;

      slug = `${generateSlug(baseSlug)}-${counter}`;
      counter++;
    }
  }

  @Post()
  async create(@Body() dto: CreateAdminProductDto) {
    if (!dto.name?.trim()) {
      throw new BadRequestException('Nome obrigatório');
    }

    if (!dto.categoryId) {
      throw new BadRequestException('Categoria obrigatória');
    }

    if (!dto.image) {
      throw new BadRequestException('Imagem obrigatória');
    }

    const slug = await this.getUniqueSlug(dto.slug || dto.name);

    return this.prisma.product.create({
      data: {
        ...dto,
        name: dto.name.trim(),
        slug,
      },
    });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAdminProductDto) {
    const current = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!current) {
      throw new BadRequestException('Produto não encontrado');
    }

    const slug = await this.getUniqueSlug(dto.slug || dto.name || current.slug, id);

    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        slug,
      },
    });
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
