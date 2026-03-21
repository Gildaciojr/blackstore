import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async addToCart(data: AddToCartDto) {
    const existing = await this.prisma.cartItem.findFirst({
      where: {
        customerId: data.customerId,
        productId: data.productId,
      },
    });

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + data.quantity,
        },
      });
    }

    return this.prisma.cartItem.create({
      data,
    });
  }

  async getCart(customerId: string) {
    return this.prisma.cartItem.findMany({
      where: { customerId },
      include: {
        product: true,
      },
    });
  }

  async updateQuantity(data: UpdateCartDto) {
    return this.prisma.cartItem.update({
      where: { id: data.cartItemId },
      data: {
        quantity: data.quantity,
      },
    });
  }

  async removeItem(id: string) {
    return this.prisma.cartItem.delete({
      where: { id },
    });
  }

  async clearCart(customerId: string) {
    return this.prisma.cartItem.deleteMany({
      where: { customerId },
    });
  }
}
