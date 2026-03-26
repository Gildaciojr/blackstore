import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductSize, ProductVariant } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private async getProductWithVariants(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: true,
        medias: true,
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  private resolveVariantBySize(variants: ProductVariant[], size?: ProductSize, variantId?: string) {
    if (!variants.length) {
      return null;
    }

    if (variantId) {
      const variantById = variants.find((item) => item.id === variantId);

      if (!variantById) {
        throw new BadRequestException('Variação do produto não encontrada');
      }

      if (size && variantById.size !== size) {
        throw new BadRequestException('variantId e size não correspondem entre si');
      }

      return variantById;
    }

    if (!size) {
      throw new BadRequestException('Tamanho obrigatório para este produto');
    }

    const variantBySize = variants.find((item) => item.size === size);

    if (!variantBySize) {
      throw new BadRequestException(`Tamanho ${size} indisponível para este produto`);
    }

    return variantBySize;
  }

  async addToCart(data: AddToCartDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await this.getProductWithVariants(data.productId);

      if (!product.variants.length && (data.size || data.variantId)) {
        throw new BadRequestException('Este produto não possui variações de tamanho');
      }

      const selectedVariant = this.resolveVariantBySize(
        product.variants,
        data.size,
        data.variantId,
      );

      const size = selectedVariant?.size ?? null;
      const variantId = selectedVariant?.id ?? null;

      const existing = await tx.cartItem.findFirst({
        where: {
          customerId: data.customerId,
          productId: data.productId,
          variantId,
          size,
        },
      });

      const nextQuantity = existing ? existing.quantity + data.quantity : data.quantity;

      if (selectedVariant) {
        if (selectedVariant.stock < nextQuantity) {
          throw new BadRequestException(
            `Estoque insuficiente para o tamanho ${selectedVariant.size}`,
          );
        }
      } else {
        if (product.stock < nextQuantity) {
          throw new BadRequestException('Produto sem estoque suficiente');
        }
      }

      if (existing) {
        return tx.cartItem.update({
          where: { id: existing.id },
          data: {
            quantity: nextQuantity,
          },
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
        });
      }

      return tx.cartItem.create({
        data: {
          customerId: data.customerId,
          productId: data.productId,
          quantity: data.quantity,
          size,
          variantId,
        },
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
      });
    });
  }

  async getCart(customerId: string) {
    return this.prisma.cartItem.findMany({
      where: { customerId },
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
    });
  }

  async updateQuantity(data: UpdateCartDto) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: data.cartItemId },
      include: {
        product: true,
        variant: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Item do carrinho não encontrado');
    }

    if (cartItem.variant) {
      if (cartItem.variant.stock < data.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para o tamanho ${cartItem.variant.size}`,
        );
      }
    } else {
      if (cartItem.product.stock < data.quantity) {
        throw new BadRequestException('Produto sem estoque suficiente');
      }
    }

    return this.prisma.cartItem.update({
      where: { id: data.cartItemId },
      data: {
        quantity: data.quantity,
      },
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
