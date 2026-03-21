import { Controller, Post, Get, Patch, Delete, Body, Param } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Post('add')
  add(@Body() data: AddToCartDto) {
    return this.cartService.addToCart(data);
  }

  @Get(':customerId')
  getCart(@Param('customerId') customerId: string) {
    return this.cartService.getCart(customerId);
  }

  @Patch('update')
  update(@Body() data: UpdateCartDto) {
    return this.cartService.updateQuantity(data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartService.removeItem(id);
  }
}
