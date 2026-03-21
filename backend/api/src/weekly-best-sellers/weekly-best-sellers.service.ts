import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type SetWeeklyDto = {
  position: number;
  productId: string;
};

@Injectable()
export class WeeklyBestSellersService {
  constructor(private prisma: PrismaService) {}

  // 🔥 BUSCAR RANKING COMPLETO
  async findAll() {
    return this.prisma.weeklyBestSeller.findMany({
      orderBy: { position: 'asc' },
      include: {
        product: {
          include: {
            category: true,
            medias: true,
          },
        },
      },
    });
  }

  // 🔥 DEFINIR RANKING (PAINEL ADMIN)
  async setRanking(data: SetWeeklyDto[]) {
    if (!data || data.length === 0) {
      throw new BadRequestException('Ranking vazio');
    }

    if (data.length !== 4) {
      throw new BadRequestException('O ranking deve conter exatamente 4 produtos');
    }

    const positions = data.map((d) => d.position);

    const uniquePositions = new Set(positions);

    if (uniquePositions.size !== 4) {
      throw new BadRequestException('Posições duplicadas');
    }

    // 🔥 limpa ranking atual
    await this.prisma.weeklyBestSeller.deleteMany();

    // 🔥 cria novo ranking
    return this.prisma.weeklyBestSeller.createMany({
      data: data.map((item) => ({
        position: item.position,
        productId: item.productId,
      })),
    });
  }
}
