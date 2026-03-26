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
        where: ignoreId ? { slug, id: { not: ignoreId } } : { slug },
      });

      if (!existing) return slug;

      slug = `${generateSlug(baseSlug)}-${counter}`;
      counter++;
    }
  }

  /**
   * 🔥 VALIDAÇÃO DE VARIANTS DUPLICADAS
   */
  private validateVariants(variants?: { size: string }[]) {
    if (!variants || variants.length === 0) return;

    const sizes = variants.map((v) => v.size);
    const uniqueSizes = new Set(sizes);

    if (sizes.length !== uniqueSizes.size) {
      throw new BadRequestException('Não é permitido repetir tamanhos nas variantes');
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

    this.validateVariants(dto.variants);

    const slug = await this.getUniqueSlug(dto.slug || dto.name);

    const { medias, variants, ...productData } = dto;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        name: dto.name.trim(),
        slug,

        medias:
          medias && medias.length > 0
            ? {
                create: medias.map((url) => ({
                  url,
                  type: 'image',
                })),
              }
            : undefined,

        variants:
          variants && variants.length > 0
            ? {
                create: variants.map((v) => ({
                  size: v.size,
                  stock: v.stock,
                })),
              }
            : undefined,
      },
      include: {
        medias: true,
        variants: true,
        category: true,
      },
    });

    return product;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAdminProductDto) {
    const current = await this.prisma.product.findUnique({
      where: { id },
      include: { medias: true, variants: true },
    });

    if (!current) {
      throw new BadRequestException('Produto não encontrado');
    }

    this.validateVariants(dto.variants);

    const slug = await this.getUniqueSlug(dto.slug || dto.name || current.slug, id);

    const medias = dto.medias;
    const variants = dto.variants;

    const { name, description, price, oldPrice, image, stock, categoryId } = dto;

    /**
     * 🔥 GALERIA
     */
    if (medias) {
      await this.prisma.media.deleteMany({
        where: { productId: id },
      });
    }

    /**
     * 🔥 VARIANTS (RECRIAÇÃO SEGURA)
     */
    if (variants) {
      await this.prisma.productVariant.deleteMany({
        where: { productId: id },
      });
    }

    await this.prisma.product.update({
      where: { id },
      data: {
        name: name?.trim() ?? current.name,
        description,
        price,
        oldPrice,
        image,
        stock,
        categoryId,
        slug,

        medias:
          medias && medias.length > 0
            ? {
                create: medias.map((url) => ({
                  url,
                  type: 'image',
                })),
              }
            : undefined,

        variants:
          variants && variants.length > 0
            ? {
                create: variants.map((v) => ({
                  size: v.size,
                  stock: v.stock,
                })),
              }
            : undefined,
      },
    });

    const finalProduct = await this.prisma.product.findUnique({
      where: { id },
      include: {
        medias: true,
        variants: true,
        category: true,
      },
    });

    return finalProduct;
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
