import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private getAvailableStock(stock: number, reservedStock: number) {
    return Math.max(0, stock - reservedStock);
  }

  private withAvailableStock<
    T extends {
      stock: number;
      reservedStock: number;
      variants: Array<{
        stock: number;
        reservedStock: number;
      }>;
    },
  >(product: T) {
    return {
      ...product,
      stock: this.getAvailableStock(product.stock, product.reservedStock),
      variants: product.variants.map((variant) => ({
        ...variant,
        stock: this.getAvailableStock(variant.stock, variant.reservedStock),
      })),
    };
  }

  async create(data: CreateProductDto) {
    const { variants, ...productData } = data;

    const hasVariants = variants && variants.length > 0;

    const totalStock = hasVariants
      ? variants.reduce((acc, variant) => acc + variant.stock, 0)
      : productData.stock;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        stock: totalStock,
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

    return products.map((product) => this.withAvailableStock(product));
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

    if (!product) {
      return null;
    }

    return this.withAvailableStock(product);
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

    return products.map((product) => this.withAvailableStock(product));
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
      ? variants.reduce((acc, variant) => acc + variant.stock, 0)
      : productData.stock;

    await this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        stock: totalStock,
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
