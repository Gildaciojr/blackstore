import { Controller, Get, Post, Body } from '@nestjs/common';
import { WeeklyBestSellersService } from './weekly-best-sellers.service';
import { SetWeeklyBestSellersDto } from './dto/set-weekly-best-sellers.dto';

@Controller('weekly-best-sellers')
export class WeeklyBestSellersController {
  constructor(private readonly service: WeeklyBestSellersService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Post()
  async setRanking(@Body() data: SetWeeklyBestSellersDto[]) {
    return this.service.setRanking(data);
  }
}
