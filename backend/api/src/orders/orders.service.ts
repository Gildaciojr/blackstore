import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(data: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      const shippingPriceRaw = Number(data.shippingPrice || 0);

      if (Number.isNaN(shippingPriceRaw) || shippingPriceRaw < 0) {
        throw new BadRequestException('Frete inválido');
      }

      const shippingPrice = Number(shippingPriceRaw.toFixed(2));

      const address = await tx.address.findFirst({
        where: {
          id: data.addressId,
          customerId: data.customerId,
        },
      });

      if (!address) {
        throw new BadRequestException('Endereço inválido para este cliente');
      }

      const cartItems = await tx.cartItem.findMany({
        where: { customerId: data.customerId },
        include: {
          product: true,
          variant: true,
        },
      });

      if (!cartItems.length) {
        throw new BadRequestException('Cart is empty');
      }

      /**
       * 🔥 VALIDAÇÃO DE ESTOQUE
       */
      for (const item of cartItems) {
        if (item.variant) {
          if (item.variant.stock < item.quantity) {
            throw new BadRequestException(`Estoque insuficiente para tamanho ${item.variant.size}`);
          }
        } else {
          if (item.product.stock < item.quantity) {
            throw new BadRequestException(`Produto "${item.product.name}" sem estoque suficiente`);
          }
        }
      }

      /**
       * 🔥 SUBTOTAL
       */
      const subtotal = Number(
        cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0).toFixed(2),
      );

      if (subtotal <= 0) {
        throw new BadRequestException('Subtotal inválido');
      }

      /**
       * 🔥 CUPOM
       */
      let discountValue = 0;
      let appliedCouponCode: string | null = null;

      if (data.couponCode) {
        const normalizedCode = data.couponCode.trim().toUpperCase();

        const coupon = await tx.coupon.findUnique({
          where: { code: normalizedCode },
        });

        if (!coupon) {
          throw new BadRequestException('Cupom inválido');
        }

        if (!coupon.active) {
          throw new BadRequestException('Cupom desativado'); // 🔥 ADICIONAR
        }

        if (coupon.expiresAt < new Date()) {
          throw new BadRequestException('Cupom expirado');
        }

        const updatedCoupon = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            used: { lt: coupon.maxUses },
            expiresAt: { gt: new Date() }, // 🔥 ADICIONAR
            active: true, // 🔥 ADICIONAR
          },
          data: {
            used: {
              increment: 1,
            },
          },
        });

        if (updatedCoupon.count === 0) {
          throw new BadRequestException('Cupom esgotado');
        }

        discountValue = Number((subtotal * (coupon.discount / 100)).toFixed(2));

        if (discountValue > subtotal) {
          discountValue = subtotal;
        }

        appliedCouponCode = normalizedCode;
      }

      let subtotalWithDiscount = Number((subtotal - discountValue).toFixed(2));

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
          addressId: data.addressId,
          subtotal: subtotalWithDiscount,
          shippingPrice,
          total,
          couponCode: appliedCouponCode,
          discount: discountValue,
          shippingMethod: data.shippingMethod,
          shippingName: data.shippingName,
          shippingDeadline: data.shippingDeadline,
          status: 'pending',
        },
      });

      /**
       * 🔥 ITENS DO PEDIDO
       */
      await tx.orderItem.createMany({
        data: cartItems.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId ?? null,
          size: item.size ?? null,
          quantity: item.quantity,
          price: item.product.price,
        })),
      });

      /**
       * 🔥 BAIXA DE ESTOQUE
       */
      for (const item of cartItems) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      /**
       * 🔥 LIMPAR CARRINHO
       */
      await tx.cartItem.deleteMany({
        where: { customerId: data.customerId },
      });

      /**
       * 🔥 RETORNA PEDIDO COMPLETO
       */
      const finalOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: {
          customer: true,
          address: true,
          items: {
            include: {
              product: {
                include: {
                  medias: true,
                  category: true,
                  variants: true,
                },
              },
              variant: true,
            },
          },
          payment: true,
        },
      });

      return finalOrder;
    });
  }

  async getOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
        customer: true,
        address: true,
        items: {
          include: {
            product: {
              include: {
                medias: true,
                category: true,
                variants: true,
              },
            },
            variant: true,
          },
        },
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        address: true,
        items: {
          include: {
            product: {
              include: {
                medias: true,
                category: true,
                variants: true,
              },
            },
            variant: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return order;
  }
}
