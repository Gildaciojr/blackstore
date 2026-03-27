import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HomeSectionType } from '@prisma/client';

@Injectable()
export class HomeSectionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * =========================
   * BASE QUERY REUTILIZÁVEL
   * =========================
   */
  private baseInclude = {
    product: {
      include: {
        category: true,
        medias: true,
        variants: true,
      },
    },
  };

  /**
   * =========================
   * HERO (com override completo)
   * =========================
   */
  async getHero() {
    const items = await this.prisma.homeSectionItem.findMany({
      where: { type: HomeSectionType.HERO },
      orderBy: { position: 'asc' },
      include: this.baseInclude,
    });

    return items.map((item) => ({
      id: item.id,
      position: item.position,

      product: item.product,

      // 🔥 OVERRIDES DO HERO
      hero: {
        type: item.heroSlideType,
        image: item.imageOverride ?? item.product.image,
        focus: item.focus,
        focusDesktop: item.focusDesktop,
        title1: item.title1,
        title2: item.title2,
        subtitle: item.subtitle,
        cta1: item.cta1,
        cta2: item.cta2,
      },
    }));
  }

  /**
   * =========================
   * LAUNCHES
   * =========================
   */
  async getLaunches() {
    return this.prisma.homeSectionItem.findMany({
      where: { type: HomeSectionType.LAUNCHES },
      orderBy: { position: 'asc' },
      include: this.baseInclude,
    });
  }

  /**
   * =========================
   * PROMOTIONS
   * =========================
   */
  async getPromotions() {
    return this.prisma.homeSectionItem.findMany({
      where: { type: HomeSectionType.PROMOTIONS },
      orderBy: { position: 'asc' },
      include: this.baseInclude,
    });
  }

  /**
   * =========================
   * LOOKBOOK (separado do HomeSection)
   * =========================
   */
  async getLookbook() {
    return this.prisma.lookbookItem.findMany({
      where: { active: true },
      orderBy: { position: 'asc' },
      include: this.baseInclude,
    });
  }

  /**
   * =========================
   * BEST SELLERS (já existente)
   * =========================
   */
  async getBestSellers() {
    return this.prisma.weeklyBestSeller.findMany({
      orderBy: { position: 'asc' },
      include: this.baseInclude,
    });
  }

  async setSection(type: HomeSectionType, items: any[]) {
    if (!items || items.length === 0) {
      throw new Error('Lista vazia');
    }

    // valida duplicação de produto
    const productIds = items.map((i) => i.productId);
    const uniqueProducts = new Set(productIds);

    if (uniqueProducts.size !== items.length) {
      throw new Error('Produtos duplicados na mesma seção');
    }

    // valida posições
    const positions = items.map((i) => i.position);
    const uniquePositions = new Set(positions);

    if (uniquePositions.size !== items.length) {
      throw new Error('Posições duplicadas');
    }

    return this.prisma.$transaction(async (tx) => {
      // 🔥 LIMPA A SEÇÃO
      await tx.homeSectionItem.deleteMany({
        where: { type },
      });

      // 🔥 RECRIA
      return tx.homeSectionItem.createMany({
        data: items.map((item) => ({
          type,
          position: item.position,
          productId: item.productId,

          heroSlideType: item.heroSlideType,
          imageOverride: item.imageOverride,
          focus: item.focus,
          focusDesktop: item.focusDesktop,
          title1: item.title1,
          title2: item.title2,
          subtitle: item.subtitle,
          cta1: item.cta1,
          cta2: item.cta2,
        })),
      });
    });
  }

  /**
   * =========================
   * HOME COMPLETA
   * =========================
   */
  async getHome() {
    const [hero, launches, promotions, lookbook, bestSellers] = await Promise.all([
      this.getHero(),
      this.getLaunches(),
      this.getPromotions(),
      this.getLookbook(),
      this.getBestSellers(),
    ]);

    return {
      hero,
      launches,
      promotions,
      lookbook,
      bestSellers,
    };
  }
}
