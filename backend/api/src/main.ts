import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const uploadsPath = join(process.cwd(), 'uploads');
  const productsPath = join(uploadsPath, 'products');
  const mediaPath = join(uploadsPath, 'media');

  if (!existsSync(uploadsPath)) mkdirSync(uploadsPath, { recursive: true });
  if (!existsSync(productsPath)) mkdirSync(productsPath, { recursive: true });
  if (!existsSync(mediaPath)) mkdirSync(mediaPath, { recursive: true });

  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads',
  });

  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4000);
}

bootstrap();
