import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customer')
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Get(':id/profile')
  getProfile(@Param('id') id: string) {
    return this.customerService.getProfile(id);
  }

  @Patch(':id/profile')
  updateProfile(@Param('id') id: string, @Body() data: UpdateCustomerDto) {
    return this.customerService.updateProfile(id, data);
  }

  @Get(':id/orders')
  getOrders(@Param('id') id: string) {
    return this.customerService.getOrders(id);
  }
}
