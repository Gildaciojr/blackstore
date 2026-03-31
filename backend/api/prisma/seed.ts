import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando seed...');

  /**
   * =========================
   * CATEGORIA BASE (SAFE)
   * =========================
   */
  await prisma.category.upsert({
    where: { slug: 'fitness' },
    update: {},
    create: {
      name: 'Fitness Feminino',
      slug: 'fitness',
    },
  });

  /**
   * =========================
   * SHIPPING (NÃO DESTRUTIVO)
   * =========================
   */

  const shippingCount = await prisma.shippingRate.count();

  if (shippingCount === 0) {
    console.log('Criando fretes iniciais...');

    await prisma.shippingRate.createMany({
      data: [
        {
          name: 'PAC',
          method: 'pac',
          price: 15,
          minDays: 5,
          maxDays: 10,
          cepPrefix: '74',
        },
        {
          name: 'SEDEX',
          method: 'sedex',
          price: 25,
          minDays: 2,
          maxDays: 5,
          cepPrefix: '74',
        },
        {
          name: 'Padrão',
          method: 'default',
          price: 20,
          minDays: 3,
          maxDays: 7,
          cepPrefix: null,
        },
      ],
    });
  } else {
    console.log('Fretes já existem. Seed não irá sobrescrever.');
  }

  console.log('Seed executado com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
