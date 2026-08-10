import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

const orderDetails = {
  customer: {
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      phone: true,
      cpf: true,
      createdAt: true,
    },
  },
  address: true,
  items: {
    include: {
      product: { include: { medias: true, category: true, variants: true } },
      variant: true,
    },
  },
  payment: true,
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private async findCheckout(checkoutKey: string) {
    return this.prisma.order.findUnique({
      where: { checkoutKey },
      include: orderDetails,
    });
  }

  private assertCheckoutOwner(order: { customerId: string }, customerId: string) {
    if (order.customerId !== customerId) {
      throw new ForbiddenException('checkoutKey belongs to another customer');
    }
  }

  private async reserveCoupon(tx: Prisma.TransactionClient, code: string, subtotal: number) {
    const normalizedCode = code.trim().toUpperCase();
    const coupon = await tx.coupon.findUnique({ where: { code: normalizedCode } });
    if (!coupon) throw new BadRequestException('Cupom inválido');

    const now = new Date();
    const affected = await tx.$executeRaw(
      Prisma.sql`UPDATE "Coupon"
        SET "reserved" = "reserved" + 1
        WHERE "id" = ${coupon.id}
          AND "active" = true
          AND "expiresAt" > ${now}
          AND "used" + "reserved" < "maxUses"`,
    );
    if (affected !== 1) throw new BadRequestException('Cupom indisponível ou esgotado');

    return {
      id: coupon.id,
      code: normalizedCode,
      discount: Math.min(subtotal, Number((subtotal * (coupon.discount / 100)).toFixed(2))),
    };
  }

  private async reserveStock(
    tx: Prisma.TransactionClient,
    items: Array<{
      productId: string;
      variantId: string | null;
      quantity: number;
      product: { name: string; variants: Array<{ id: string }> };
      variant: { id: string; productId: string; size: string } | null;
    }>,
  ) {
    const variantProductIds = new Set<string>();
    const orderedItems = [...items].sort((left, right) =>
      `${left.productId}:${left.variantId ?? ''}`.localeCompare(
        `${right.productId}:${right.variantId ?? ''}`,
      ),
    );
    const productsWithVariants = [
      ...new Set(
        orderedItems
          .filter((item) => item.product.variants.length > 0)
          .map((item) => item.productId),
      ),
    ].sort();

    if (productsWithVariants.length) {
      await tx.$queryRaw(
        Prisma.sql`SELECT "id" FROM "Product"
          WHERE "id" IN (${Prisma.join(productsWithVariants)})
          ORDER BY "id" FOR UPDATE`,
      );
    }

    for (const item of orderedItems) {
      if (item.product.variants.length) {
        if (!item.variantId || !item.variant || item.variant.productId !== item.productId) {
          throw new BadRequestException(`Variação inválida para "${item.product.name}"`);
        }
        const reserved = await tx.productVariant.updateMany({
          where: { id: item.variantId, productId: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (reserved.count !== 1) {
          throw new BadRequestException(`Estoque insuficiente para tamanho ${item.variant.size}`);
        }
        variantProductIds.add(item.productId);
      } else {
        const reserved = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (reserved.count !== 1) {
          throw new BadRequestException(`Produto "${item.product.name}" sem estoque suficiente`);
        }
      }
    }

    for (const productId of variantProductIds) {
      const aggregate = await tx.productVariant.aggregate({
        where: { productId },
        _sum: { stock: true },
      });
      await tx.product.update({
        where: { id: productId },
        data: { stock: aggregate._sum.stock ?? 0 },
      });
    }
  }

  private async removeReservedCartSnapshot(
    tx: Prisma.TransactionClient,
    items: Array<{ id: string; customerId: string; quantity: number }>,
  ) {
    for (const item of items) {
      const reduced = await tx.cartItem.updateMany({
        where: { id: item.id, customerId: item.customerId, quantity: { gt: item.quantity } },
        data: { quantity: { decrement: item.quantity } },
      });
      if (reduced.count === 0) {
        await tx.cartItem.deleteMany({
          where: { id: item.id, customerId: item.customerId, quantity: item.quantity },
        });
      }
    }
  }

  async createOrder(data: CreateOrderDto, authenticatedCustomerId: string) {
    if (data.customerId !== authenticatedCustomerId) {
      throw new ForbiddenException('Customer ownership mismatch');
    }

    const existing = await this.findCheckout(data.checkoutKey);
    if (existing) {
      this.assertCheckoutOwner(existing, authenticatedCustomerId);
      return existing;
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const shippingPriceRaw = Number(data.shippingPrice || 0);
        if (!Number.isFinite(shippingPriceRaw) || shippingPriceRaw < 0) {
          throw new BadRequestException('Frete inválido');
        }
        const shippingPrice = Number(shippingPriceRaw.toFixed(2));

        const address = await tx.address.findFirst({
          where: { id: data.addressId, customerId: authenticatedCustomerId },
        });
        if (!address) throw new BadRequestException('Endereço inválido para este cliente');

        const cartItems = await tx.cartItem.findMany({
          where: { customerId: authenticatedCustomerId },
          include: { product: { include: { variants: true } }, variant: true },
        });
        if (!cartItems.length) throw new BadRequestException('Cart is empty');

        const subtotal = Number(
          cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2),
        );
        if (subtotal <= 0) throw new BadRequestException('Subtotal inválido');

        await this.reserveStock(tx, cartItems);
        const coupon = data.couponCode
          ? await this.reserveCoupon(tx, data.couponCode, subtotal)
          : null;
        const discount = coupon?.discount ?? 0;
        const discountedSubtotal = Math.max(0, Number((subtotal - discount).toFixed(2)));
        const total = Number((discountedSubtotal + shippingPrice).toFixed(2));

        const order = await tx.order.create({
          data: {
            checkoutKey: data.checkoutKey,
            reservationStatus: ReservationStatus.RESERVED,
            reservationExpiresAt: null,
            customerId: authenticatedCustomerId,
            addressId: data.addressId,
            subtotal: discountedSubtotal,
            shippingPrice,
            total,
            couponId: coupon?.id ?? null,
            couponCode: coupon?.code ?? null,
            discount,
            shippingMethod: data.shippingMethod,
            shippingName: data.shippingName,
            shippingDeadline: data.shippingDeadline,
            status: 'pending',
          },
        });

        await tx.orderItem.createMany({
          data: cartItems.map((item) => ({
            orderId: order.id,
            productId: item.productId,
            variantId: item.variantId,
            size: item.size,
            quantity: item.quantity,
            price: item.product.price,
          })),
        });
        await this.removeReservedCartSnapshot(tx, cartItems);

        return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: orderDetails });
      });
    } catch (error: unknown) {
      if ((error as { code?: string }).code !== 'P2002') throw error;
      const winner = await this.findCheckout(data.checkoutKey);
      if (!winner) throw error;
      this.assertCheckoutOwner(winner, authenticatedCustomerId);
      return winner;
    }
  }

  async getOrders(customerId: string, authenticatedCustomerId: string) {
    if (customerId !== authenticatedCustomerId) {
      throw new ForbiddenException('Customer ownership mismatch');
    }
    return this.prisma.order.findMany({
      where: { customerId: authenticatedCustomerId },
      include: orderDetails,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrder(id: string, authenticatedCustomerId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, customerId: authenticatedCustomerId },
      include: orderDetails,
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return order;
  }
}
