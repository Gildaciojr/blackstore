import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCategoryDto) {
    return await this.prisma.category.create({
      data,
    });
  }

  async findAll() {
    return await this.prisma.category.findMany({
      include: {
        products: true,
      },
    });
  }

  async findBySlug(slug: string) {
    return await this.prisma.category.findUnique({
      where: { slug },
      include: {
        products: true,
      },
    });
  }
}
