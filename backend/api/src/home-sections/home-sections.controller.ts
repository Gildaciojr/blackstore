import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { HomeSectionsService } from './home-sections.service';
import { HomeSectionType } from '@prisma/client';
import { SetHomeSectionItemDto } from './dto/set-home-sections.dto';

@Controller()
export class HomeSectionsController {
  constructor(private readonly service: HomeSectionsService) {}

  @Get('home')
  async getHome() {
    return this.service.getHome();
  }

  // 🔥 ADMIN
  @Post('admin/home-sections/:type')
  async setSection(@Param('type') type: HomeSectionType, @Body() items: SetHomeSectionItemDto[]) {
    return this.service.setSection(type, items);
  }
}
