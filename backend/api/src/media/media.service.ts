import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async create(type: string, title: string | undefined, url: string, productId?: string) {
    return this.prisma.media.create({
      data: {
        type,
        title,
        url,
        productId, // 🔥 RELAÇÃO COM PRODUCT
      },
    });
  }

  async findAll(type?: string) {
    return this.prisma.media.findMany({
      where: type ? { type } : {},
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async delete(id: string) {
    return this.prisma.media.delete({
      where: { id },
    });
  }
}
