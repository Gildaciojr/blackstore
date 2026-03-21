import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',

    // 👇 ADICIONE ISSO
    seed: 'npx ts-node prisma/seed.ts',
  },

  datasource: {
    url: process.env.DATABASE_URL,
  },
});
