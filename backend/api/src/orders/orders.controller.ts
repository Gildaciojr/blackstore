import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CustomerJwtGuard, type AuthenticatedCustomer } from '../auth/customer-jwt.guard';
import { CurrentCustomer } from '../auth/current-customer.decorator';

@Controller('orders')
@UseGuards(CustomerJwtGuard)
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
  checkout(@Body() data: CreateOrderDto, @CurrentCustomer() customer: AuthenticatedCustomer) {
    return this.ordersService.createOrder(data, customer.id);
  }

  @Get(':customerId')
  getOrders(
    @Param('customerId') customerId: string,
    @CurrentCustomer() customer: AuthenticatedCustomer,
  ) {
    return this.ordersService.getOrders(customerId, customer.id);
  }

  @Get('order/:id')
  getOrder(@Param('id') id: string, @CurrentCustomer() customer: AuthenticatedCustomer) {
    return this.ordersService.getOrder(id, customer.id);
  }
}
