import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
    prefix: '/uploads',
  });

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
  app.enableCors({
    origin: true,
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
