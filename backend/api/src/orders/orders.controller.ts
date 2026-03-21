import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('checkout')
  checkout(@Body() data: CreateOrderDto) {
    return this.ordersService.createOrder(data);
  }

  @Get(':customerId')
  getOrders(@Param('customerId') customerId: string) {
    return this.ordersService.getOrders(customerId);
  }

  @Get('order/:id')
  getOrder(@Param('id') id: string) {
    return this.ordersService.getOrder(id);
  }
}
