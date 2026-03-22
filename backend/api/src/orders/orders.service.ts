import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(data: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { customerId: data.customerId },
        select: {
          id: true,
          quantity: true,
          productId: true,
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
            },
          },
        },
      });

      if (!cartItems.length) {
        throw new BadRequestException('Cart is empty');
      }

      /**
       * validar estoque
       */
      for (const item of cartItems) {
        if (item.product.stock < item.quantity) {
          throw new BadRequestException(`Produto "${item.product.name}" sem estoque suficiente`);
        }
      }

      /**
       * subtotal
       */
      const subtotal = cartItems.reduce((acc, item) => {
        return acc + item.product.price * item.quantity;
      }, 0);

      if (subtotal <= 0) {
        throw new BadRequestException('Subtotal inválido');
      }

      /**
       * CUPOM
       */
      let discountValue = 0;

      if (data.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: {
            code: data.couponCode.toUpperCase(),
          },
        });

        if (!coupon) {
          throw new BadRequestException('Cupom inválido');
        }

        if (coupon.expiresAt < new Date()) {
          throw new BadRequestException('Cupom expirado');
        }

        if (coupon.used >= coupon.maxUses) {
          throw new BadRequestException('Cupom esgotado');
        }

        discountValue = subtotal * (coupon.discount / 100);

        /**
         * 🔥 PROTEÇÃO CRÍTICA
         */
        if (discountValue > subtotal) {
          discountValue = subtotal;
        }

        await tx.coupon.update({
          where: { id: coupon.id },
          data: {
            used: {
              increment: 1,
            },
          },
        });
      }

      const subtotalWithDiscount = subtotal - discountValue;

      const total = subtotalWithDiscount + data.shippingPrice;

      /**
       * criar pedido
       */
      const order = await tx.order.create({
        data: {
          customerId: data.customerId,

          subtotal: subtotalWithDiscount,
          shippingPrice: data.shippingPrice,
          total,

          shippingMethod: data.shippingMethod,
          shippingName: data.shippingName,
          shippingDeadline: data.shippingDeadline,

          addressId: data.addressId,

          status: 'pending',
        },
      });

      /**
       * itens
       */
      await tx.orderItem.createMany({
        data: cartItems.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
        })),
      });

      /**
       * estoque
       */
      await Promise.all(
        cartItems.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          }),
        ),
      );

      /**
       * limpar carrinho
       */
      await tx.cartItem.deleteMany({
        where: { customerId: data.customerId },
      });

      return order;
    });
  }

  async getOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOrder(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }
}
