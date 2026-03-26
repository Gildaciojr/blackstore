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
