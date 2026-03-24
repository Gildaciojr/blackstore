import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProductDto) {
    const product = await this.prisma.product.create({
      data,
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
      },
    });

    console.log('📂 [GET PRODUCTS BY CATEGORY]');
    console.log('CATEGORY SLUG:', slug);
    console.dir(products, { depth: 2 });

    return products;
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
