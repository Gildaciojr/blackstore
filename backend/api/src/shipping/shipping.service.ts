import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShippingService {
  constructor(private prisma: PrismaService) {}

  async calculateShipping(cep: string) {
    /**
     * 🔥 NORMALIZAÇÃO
     */
    const normalizedCep = (cep || '').replace(/\D/g, '');

    if (normalizedCep.length !== 8) {
      throw new BadRequestException('CEP inválido');
    }

    const cepPrefix = normalizedCep.substring(0, 2);

    const rates = await this.prisma.shippingRate.findMany({
      where: {
        OR: [{ cepPrefix }, { cepPrefix: null }],
      },
      orderBy: [{ cepPrefix: 'desc' }, { price: 'asc' }],
    });

    if (!rates.length) {
      throw new BadRequestException('Nenhuma opção de frete disponível');
    }

    return rates.map((rate) => ({
      name: rate.name,
      method: rate.method,
      price: Number(rate.price.toFixed(2)),
      deadline: `${rate.minDays}-${rate.maxDays} dias`,
    }));
  }
}
