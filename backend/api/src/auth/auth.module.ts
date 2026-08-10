import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomerJwtGuard } from './customer-jwt.guard';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, CustomerJwtGuard],
  exports: [CustomerJwtGuard],
})
export class AuthModule {}
