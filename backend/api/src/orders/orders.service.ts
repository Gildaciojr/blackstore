import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(data: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      /**
       * 🔥 NORMALIZAÇÃO SEGURA DE FRETE
       */
      const shippingPriceRaw = Number(data.shippingPrice || 0);

      if (isNaN(shippingPriceRaw) || shippingPriceRaw < 0) {
        throw new BadRequestException('Frete inválido');
      }

      const shippingPrice = Number(shippingPriceRaw.toFixed(2));

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
       * 🔥 VALIDAÇÃO DE ESTOQUE
       */
      for (const item of cartItems) {
        if (item.product.stock < item.quantity) {
          throw new BadRequestException(`Produto "${item.product.name}" sem estoque suficiente`);
        }
      }

      /**
       * 🔥 SUBTOTAL (COM ARREDONDAMENTO)
       */
      const subtotal = Number(
        cartItems
          .reduce((acc, item) => {
            return acc + item.product.price * item.quantity;
          }, 0)
          .toFixed(2),
      );

      if (subtotal <= 0) {
        throw new BadRequestException('Subtotal inválido');
      }

      /**
       * 🔥 CUPOM
       */
      let discountValue = 0;

      if (data.couponCode) {
        const normalizedCode = data.couponCode.trim().toUpperCase();

        const coupon = await tx.coupon.findUnique({
          where: {
            code: normalizedCode,
          },
        });

        if (!coupon) {
          throw new BadRequestException('Cupom inválido');
        }

        if (coupon.expiresAt < new Date()) {
          throw new BadRequestException('Cupom expirado');
        }

        /**
         * 🔥 BLOQUEIO DE CONCORRÊNCIA (CRÍTICO)
         */
        const updated = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            used: {
              lt: coupon.maxUses,
            },
          },
          data: {
            used: {
              increment: 1,
            },
          },
        });

        if (updated.count === 0) {
          throw new BadRequestException('Cupom esgotado');
        }

        discountValue = Number((subtotal * (coupon.discount / 100)).toFixed(2));

        /**
         * 🔥 PROTEÇÃO
         */
        if (discountValue > subtotal) {
          discountValue = subtotal;
        }
      }

      let subtotalWithDiscount = Number((subtotal - discountValue).toFixed(2));

      /**
       * 🔥 PROTEÇÃO FINAL
       */
      if (subtotalWithDiscount < 0) {
        subtotalWithDiscount = 0;
      }

      const total = Number((subtotalWithDiscount + shippingPrice).toFixed(2));

      /**
       * 🔥 CRIAR PEDIDO
       */
      const order = await tx.order.create({
        data: {
          customerId: data.customerId,

          subtotal: subtotalWithDiscount,
          shippingPrice,
          total,

          shippingMethod: data.shippingMethod,
          shippingName: data.shippingName,
          shippingDeadline: data.shippingDeadline,

          addressId: data.addressId,

          status: 'pending',
        },
      });

      /**
       * 🔥 ITENS
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
       * 🔥 ESTOQUE
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
       * 🔥 LIMPAR CARRINHO
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
