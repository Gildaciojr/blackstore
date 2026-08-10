import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  /**
   * =========================
   * UPLOADS (garante estrutura)
   * =========================
   */
  const uploadsPath = join(process.cwd(), 'uploads');
  const productsPath = join(uploadsPath, 'products');
  const mediaPath = join(uploadsPath, 'media');

  if (!existsSync(uploadsPath)) mkdirSync(uploadsPath, { recursive: true });
  if (!existsSync(productsPath)) mkdirSync(productsPath, { recursive: true });
  if (!existsSync(mediaPath)) mkdirSync(mediaPath, { recursive: true });

  /**
   * =========================
   * SERVIR ARQUIVOS ESTÁTICOS
   * =========================
   */
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  app.use(helmet());

  /**
   * =========================
   * VALIDAÇÃO GLOBAL (CRÍTICO)
   * =========================
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /**
   * =========================
   * CORS (necessário p/ frontend + painel)
   * =========================
   */
  const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const developmentOrigins =
    process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000', 'http://localhost:3001'];
  const allowedOrigins = new Set([...configuredOrigins, ...developmentOrigins]);

  app.enableCors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  });

  /**
   * =========================
   * START
   * =========================
   */
  await app.listen(process.env.PORT ?? 4000);
}

bootstrap();
