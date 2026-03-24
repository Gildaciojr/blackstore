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

import { CreateAdminCategoryDto } from './dto/create-admin-category.dto';
import { UpdateAdminCategoryDto } from './dto/update-admin-category.dto';

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

@Controller('admin/categories')
@UseGuards(AdminJwtGuard)
export class AdminCategoriesController {
  constructor(private prisma: PrismaService) {}

  private async getUniqueSlug(baseSlug: string, ignoreId?: string): Promise<string> {
    let slug = generateSlug(baseSlug);
    let counter = 1;

    while (true) {
      const existing = await this.prisma.category.findFirst({
        where: ignoreId
          ? {
              slug,
              id: {
                not: ignoreId,
              },
            }
          : {
              slug,
            },
      });

      if (!existing) {
        return slug;
      }

      slug = `${generateSlug(baseSlug)}-${counter}`;
      counter += 1;
    }
  }

  @Post()
  async create(@Body() dto: CreateAdminCategoryDto) {
    const normalizedName = dto.name?.trim();
    const baseSlug = dto.slug?.trim() || dto.name?.trim();

    if (!normalizedName) {
      throw new BadRequestException('Nome da categoria é obrigatório');
    }

    if (!baseSlug) {
      throw new BadRequestException('Slug da categoria é obrigatório');
    }

    const slug = await this.getUniqueSlug(baseSlug);

    return this.prisma.category.create({
      data: {
        name: normalizedName,
        slug,
      },
    });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAdminCategoryDto) {
    const current = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!current) {
      throw new BadRequestException('Categoria não encontrada');
    }

    const normalizedName = dto.name?.trim() ?? current.name;
    const baseSlug = dto.slug?.trim() || dto.name?.trim() || current.slug;

    if (!normalizedName) {
      throw new BadRequestException('Nome da categoria é obrigatório');
    }

    if (!baseSlug) {
      throw new BadRequestException('Slug da categoria é obrigatório');
    }

    const slug = await this.getUniqueSlug(baseSlug, id);

    return this.prisma.category.update({
      where: { id },
      data: {
        name: normalizedName,
        slug,
      },
    });
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
