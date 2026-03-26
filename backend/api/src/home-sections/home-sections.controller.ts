import { Controller, Get } from '@nestjs/common';
import { HomeSectionsService } from './home-sections.service';

@Controller('home')
export class HomeSectionsController {
  constructor(private readonly service: HomeSectionsService) {}

  @Get()
  async getHome() {
    return this.service.getHome();
  }
}
