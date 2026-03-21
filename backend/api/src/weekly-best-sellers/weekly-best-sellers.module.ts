import { Module } from '@nestjs/common';
import { WeeklyBestSellersService } from './weekly-best-sellers.service';
import { WeeklyBestSellersController } from './weekly-best-sellers.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [WeeklyBestSellersController],
  providers: [WeeklyBestSellersService, PrismaService],
})
export class WeeklyBestSellersModule {}
