import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { CustomerJwtGuard, type AuthenticatedCustomer } from '../auth/customer-jwt.guard';
import { CurrentCustomer } from '../auth/current-customer.decorator';
import { assertCustomerOwnership } from '../auth/customer-ownership';

@Controller('address')
@UseGuards(CustomerJwtGuard)
export class AddressController {
  constructor(private addressService: AddressService) {}

  @Post()
  create(@Body() data: CreateAddressDto, @CurrentCustomer() customer: AuthenticatedCustomer) {
    assertCustomerOwnership(data.customerId, customer.id);
    return this.addressService.create({ ...data, customerId: customer.id });
  }

  @Get(':customerId')
  findAll(
    @Param('customerId') customerId: string,
    @CurrentCustomer() customer: AuthenticatedCustomer,
  ) {
    assertCustomerOwnership(customerId, customer.id);
    return this.addressService.findAll(customer.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateAddressDto,
    @CurrentCustomer() customer: AuthenticatedCustomer,
  ) {
    return this.addressService.update(id, data, customer.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentCustomer() customer: AuthenticatedCustomer) {
    return this.addressService.delete(id, customer.id);
  }
}
