import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProductDto) {
    const { variants, ...productData } = data;

    const hasVariants = variants && variants.length > 0;

    const totalStock = hasVariants
      ? variants.reduce((acc, v) => acc + v.stock, 0)
      : productData.stock;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        stock: totalStock, // 🔥 CORREÇÃO
        variants: hasVariants
          ? {
              create: variants.map((variant) => ({
                size: variant.size,
                stock: variant.stock,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        medias: true,
        variants: true,
      },
    });

    console.log('✅ [PRODUCT CREATED - SERVICE]');
    console.dir(product, { depth: null });

    return product;
  }

  async findAll() {
    const products = await this.prisma.product.findMany({
      include: {
        category: true,
        medias: true,
        variants: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('📦 [GET PRODUCTS]');
    console.dir(products, { depth: 2 });

    return products;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        medias: true,
        variants: true,
      },
    });

    console.log('🔎 [GET PRODUCT BY SLUG]');
    console.log('SLUG:', slug);
    console.dir(product, { depth: 2 });

    return product;
  }

  async findByCategory(slug: string) {
    const products = await this.prisma.product.findMany({
      where: {
        category: {
          slug,
        },
      },
      include: {
        category: true,
        medias: true,
        variants: true,
      },
    });

    console.log('📂 [GET PRODUCTS BY CATEGORY]');
    console.log('CATEGORY SLUG:', slug);
    console.dir(products, { depth: 2 });

    return products;
  }

  async update(id: string, data: CreateProductDto) {
    const { variants, ...productData } = data;

    const existing = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!existing) {
      throw new NotFoundException('Produto não encontrado');
    }

    const hasVariants = variants && variants.length > 0;

    const totalStock = hasVariants
      ? variants.reduce((acc, v) => acc + v.stock, 0)
      : productData.stock;

    await this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        stock: totalStock, // 🔥 CORREÇÃO
      },
    });

    if (variants) {
      await this.prisma.productVariant.deleteMany({
        where: { productId: id },
      });

      if (variants.length > 0) {
        await this.prisma.productVariant.createMany({
          data: variants.map((variant) => ({
            productId: id,
            size: variant.size,
            stock: variant.stock,
          })),
        });
      }
    }

    const finalProduct = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        medias: true,
        variants: true,
      },
    });

    console.log('✏️ [PRODUCT UPDATED]');
    console.dir(finalProduct, { depth: 2 });

    return finalProduct;
  }

  async delete(id: string) {
    const deleted = await this.prisma.product.delete({
      where: { id },
    });

    console.log('🗑️ [PRODUCT DELETED]');
    console.log('ID:', id);

    return deleted;
  }
}
