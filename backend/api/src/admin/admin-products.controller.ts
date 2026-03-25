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
    console.log('🔥 [CREATE PRODUCT] DTO RECEBIDO:');
    console.dir(dto, { depth: null });

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

    const { medias, ...productData } = dto;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        name: dto.name.trim(),
        slug,

        // 🔥 GALERIA
        medias:
          medias && medias.length > 0
            ? {
                create: medias.map((url) => ({
                  url,
                  type: 'image',
                })),
              }
            : undefined,
      },
      include: {
        medias: true,
      },
    });

    console.log('✅ [PRODUCT CREATED WITH GALLERY]');
    console.dir(product, { depth: null });

    return product;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAdminProductDto) {
    const current = await this.prisma.product.findUnique({
      where: { id },
      include: { medias: true },
    });

    if (!current) {
      throw new BadRequestException('Produto não encontrado');
    }

    const slug = await this.getUniqueSlug(dto.slug || dto.name || current.slug, id);

    const { medias, ...productData } = dto as any;

    // 🔥 remove antigas se vier nova galeria
    if (medias) {
      await this.prisma.media.deleteMany({
        where: { productId: id },
      });
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        slug,

        // 🔥 recria galeria
        medias:
          medias && medias.length > 0
            ? {
                create: medias.map((url: string) => ({
                  url,
                  type: 'image',
                })),
              }
            : undefined,
      },
      include: {
        medias: true,
      },
    });

    console.log('♻️ [PRODUCT UPDATED WITH GALLERY]');
    console.dir(updated, { depth: null });

    return updated;
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
