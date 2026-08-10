import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { CustomerJwtGuard, type AuthenticatedCustomer } from '../auth/customer-jwt.guard';
import { CurrentCustomer } from '../auth/current-customer.decorator';
import { assertCustomerOwnership } from '../auth/customer-ownership';

@Controller('cart')
@UseGuards(CustomerJwtGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  @Post('add')
  add(@Body() data: AddToCartDto, @CurrentCustomer() customer: AuthenticatedCustomer) {
    assertCustomerOwnership(data.customerId, customer.id);
    return this.cartService.addToCart({ ...data, customerId: customer.id });
  }

  @Get(':customerId')
  getCart(
    @Param('customerId') customerId: string,
    @CurrentCustomer() customer: AuthenticatedCustomer,
  ) {
    assertCustomerOwnership(customerId, customer.id);
    return this.cartService.getCart(customer.id);
  }

  @Patch('update')
  update(@Body() data: UpdateCartDto, @CurrentCustomer() customer: AuthenticatedCustomer) {
    return this.cartService.updateQuantity(data, customer.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentCustomer() customer: AuthenticatedCustomer) {
    return this.cartService.removeItem(id, customer.id);
  }
}
