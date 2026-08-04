import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShippingService {
  constructor(private prisma: PrismaService) {}

  async calculateShipping(cep: string) {
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

    // 🔥 FIX: Se o banco não achar regras para o CEP, retorna as opções fixas direto
    if (!rates.length) {
      return [
        {
          name: 'Padrão',
          method: 'standard',
          price: 29.9, // Ajuste para o valor que você deseja
          deadline: '7 a 14 dias',
        },
        {
          name: 'Expresso',
          method: 'express',
          price: 39.9, // Ajuste para o valor que você deseja
          deadline: '3 a 5 dias',
        },
      ];
    }

    return rates.map((rate) => ({
      name: rate.name,
      method: rate.method,
      price: Number(rate.price.toFixed(2)),
      deadline: `${rate.minDays}-${rate.maxDays} dias`,
    }));
  }
}
