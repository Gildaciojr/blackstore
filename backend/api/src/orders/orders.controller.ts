import { Body, Controller, Get, Param, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('checkout')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
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
