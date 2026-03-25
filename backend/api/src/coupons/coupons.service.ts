import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  /**
   * =========================
   * CREATE
   * =========================
   */
  async create(data: CreateCouponDto) {
    return this.prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        discount: data.discount,
        maxUses: data.maxUses,
        expiresAt: new Date(data.expiresAt),

        isFeatured: data.isFeatured ?? false,
        active: data.active ?? true,
        used: 0,
      },
    });
  }

  /**
   * =========================
   * LIST
   * =========================
   */
  async findAll() {
    return this.prisma.coupon.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * =========================
   * UPDATE
   * =========================
   */
  async update(id: string, data: UpdateCouponDto) {
    // 🔥 garante apenas 1 destaque
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
        active: data.active,
      },
    });
  }

  /**
   * =========================
   * DELETE
   * =========================
   */
  async delete(id: string) {
    return this.prisma.coupon.delete({
      where: { id },
    });
  }

  /**
   * =========================
   * VALIDATE (FRONTEND)
   * =========================
   */
  async findByCode(code: string) {
    return this.prisma.coupon.findUnique({
      where: {
        code: code.toUpperCase(),
      },
    });
  }

  /**
   * =========================
   * CUPOM EM DESTAQUE
   * =========================
   */
  async getFeatured() {
    return this.prisma.coupon.findFirst({
      where: {
        isFeatured: true,
        active: true,
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
  }
}
