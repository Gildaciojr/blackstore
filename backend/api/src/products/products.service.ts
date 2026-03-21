import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProductDto) {
    return await this.prisma.product.create({
      data,
    });
  }

  async findAll() {
    return await this.prisma.product.findMany({
      include: {
        category: true,
        medias: true, // 🔥 ESSENCIAL
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findBySlug(slug: string) {
    return await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        medias: true, // 🔥 ESSENCIAL
      },
    });
  }

  async findByCategory(slug: string) {
    return await this.prisma.product.findMany({
      where: {
        category: {
          slug,
        },
      },
      include: {
        category: true,
        medias: true, // 🔥 IMPORTANTE
      },
    });
  }

  async delete(id: string) {
    return await this.prisma.product.delete({
      where: { id },
    });
  }
}
