import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  BadRequestException,
} from '@nestjs/common';

import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Controller()
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  /**
   * ADMIN
   */

  @Post('admin/coupons')
  create(@Body() body: CreateCouponDto) {
    return this.couponsService.create(body);
  }

  @Get('admin/coupons')
  findAll() {
    return this.couponsService.findAll();
  }

  @Patch('admin/coupons/:id')
  update(@Param('id') id: string, @Body() body: UpdateCouponDto) {
    return this.couponsService.update(id, body);
  }

  @Delete('admin/coupons/:id')
  delete(@Param('id') id: string) {
    return this.couponsService.delete(id);
  }

  /**
   * PUBLIC
   */

  @Get('coupons/:code')
  async validate(@Param('code') code: string) {
    const coupon = await this.couponsService.findByCode(code);

    if (!coupon) {
      throw new BadRequestException('Cupom inválido');
    }

    if (coupon.expiresAt < new Date()) {
      throw new BadRequestException('Cupom expirado');
    }

    if (coupon.used >= coupon.maxUses) {
      throw new BadRequestException('Cupom esgotado');
    }

    return coupon;
  }

  /**
   * 🔥 NOVO ENDPOINT HERO
   */
  @Get('coupons-featured')
  getFeatured() {
    return this.couponsService.getFeatured();
  }
}
