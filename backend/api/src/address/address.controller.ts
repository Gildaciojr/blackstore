import { Controller, Post, Get, Patch, Delete, Param, Body } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('address')
export class AddressController {
  constructor(private addressService: AddressService) {}

  @Post()
  create(@Body() data: CreateAddressDto) {
    return this.addressService.create(data);
  }

  @Get(':customerId')
  findAll(@Param('customerId') customerId: string) {
    return this.addressService.findAll(customerId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateAddressDto) {
    return this.addressService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.addressService.delete(id);
  }
}
