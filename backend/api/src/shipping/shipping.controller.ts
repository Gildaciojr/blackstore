import { Controller, Post, Body } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';

@Controller('shipping')
export class ShippingController {
  constructor(private shippingService: ShippingService) {}

  @Post('calculate')
  calculate(@Body() data: CalculateShippingDto) {
    return this.shippingService.calculateShipping(data.cep);
  }
}
