import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCouponDto) {
    return this.prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        discount: data.discount,
        maxUses: data.maxUses,
        expiresAt: new Date(data.expiresAt),
        isFeatured: false,
      },
    });
  }

  async findAll() {
    return this.prisma.coupon.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: string, data: UpdateCouponDto) {
    /**
     * 🔥 GARANTE APENAS 1 CUPOM EM DESTAQUE
     */
    if (data.isFeatured) {
      await this.prisma.coupon.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      });
    }

    return this.prisma.coupon.update({
      where: { id },
      data: {
        code: data.code?.toUpperCase(),
        discount: data.discount,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        isFeatured: data.isFeatured,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.coupon.delete({
      where: { id },
    });
  }

  async findByCode(code: string) {
    return this.prisma.coupon.findUnique({
      where: {
        code: code.toUpperCase(),
      },
    });
  }

  /**
   * 🔥 NOVO: CUPOM EM DESTAQUE (PUBLIC)
   */
  async getFeatured() {
    const coupon = await this.prisma.coupon.findFirst({
      where: {
        isFeatured: true,
        expiresAt: {
          gt: new Date(),
        },
        used: {
          lt: this.prisma.coupon.fields.maxUses,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return coupon;
  }
}
