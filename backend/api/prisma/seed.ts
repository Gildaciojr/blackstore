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

  const category = await prisma.category.upsert({
    where: { slug: 'fitness' },
    update: {},
    create: {
      name: 'Fitness Feminino',
      slug: 'fitness',
    },
  });

  await prisma.product.deleteMany();

  await prisma.product.createMany({
    data: [
      {
        name: 'Top Fitness Premium Pink',
        slug: 'top-fitness-premium-pink',
        description: 'Top premium com alta sustentação e conforto.',
        price: 129.9,
        oldPrice: 159.9,
        image: '/images/product-3.jpg',
        stock: 20,
        categoryId: category.id,
      },
      {
        name: 'Conjunto Fitness Black Gold',
        slug: 'conjunto-fitness-black-gold',
        description: 'Conjunto premium com acabamento sofisticado.',
        price: 189.9,
        oldPrice: 229.9,
        image: '/images/product-4.jpg',
        stock: 15,
        categoryId: category.id,
      },
      {
        name: 'Legging Sculpt Premium',
        slug: 'legging-sculpt-premium',
        description: 'Modelagem que valoriza o corpo com conforto.',
        price: 149.9,
        oldPrice: null,
        image: '/images/product-5.jpg',
        stock: 25,
        categoryId: category.id,
      },
      {
        name: 'Top Performance Minimal',
        slug: 'top-performance-minimal',
        description: 'Minimalista, elegante e funcional.',
        price: 119.9,
        oldPrice: 139.9,
        image: '/images/product-6.jpg',
        stock: 18,
        categoryId: category.id,
      },
    ],
  });

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
