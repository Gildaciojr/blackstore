import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerJwtGuard, type AuthenticatedCustomer } from '../auth/customer-jwt.guard';
import { CurrentCustomer } from '../auth/current-customer.decorator';
import { assertCustomerOwnership } from '../auth/customer-ownership';

@Controller('customer')
@UseGuards(CustomerJwtGuard)
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Get(':id/profile')
  getProfile(@Param('id') id: string, @CurrentCustomer() customer: AuthenticatedCustomer) {
    assertCustomerOwnership(id, customer.id);
    return this.customerService.getProfile(customer.id);
  }

  @Patch(':id/profile')
  updateProfile(
    @Param('id') id: string,
    @Body() data: UpdateCustomerDto,
    @CurrentCustomer() customer: AuthenticatedCustomer,
  ) {
    assertCustomerOwnership(id, customer.id);
    return this.customerService.updateProfile(customer.id, data);
  }

  @Get(':id/orders')
  getOrders(@Param('id') id: string, @CurrentCustomer() customer: AuthenticatedCustomer) {
    assertCustomerOwnership(id, customer.id);
    return this.customerService.getOrders(customer.id);
  }
}
