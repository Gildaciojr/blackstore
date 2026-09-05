import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateAdminProductDto } from './dto/create-admin-product.dto';
import { UpdateAdminProductDto } from './dto/update-admin-product.dto';

import { AdminJwtGuard } from './guards/admin-jwt.guard';

function generateSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

@Controller('admin/products')
@UseGuards(AdminJwtGuard)
export class AdminProductsController {
  constructor(private prisma: PrismaService) {}

  private async getUniqueSlug(baseSlug: string, ignoreId?: string) {
    let slug = generateSlug(baseSlug);
    let counter = 1;

    while (true) {
      const existing = await this.prisma.product.findFirst({
        where: ignoreId ? { slug, id: { not: ignoreId } } : { slug },
      });

      if (!existing) {
        return slug;
      }

      slug = `${generateSlug(baseSlug)}-${counter}`;
      counter++;
    }
  }

  private validateVariants(variants?: Array<{ size: string }>) {
    if (!variants || variants.length === 0) {
      return;
    }

    const sizes = variants.map((variant) => variant.size);
    const uniqueSizes = new Set(sizes);

    if (sizes.length !== uniqueSizes.size) {
      throw new BadRequestException('Não é permitido repetir tamanhos nas variantes');
    }
  }

  @Post()
  async create(@Body() dto: CreateAdminProductDto) {
    if (!dto.name?.trim()) {
      throw new BadRequestException('Nome obrigatório');
    }

    if (!dto.categoryId) {
      throw new BadRequestException('Categoria obrigatória');
    }

    if (!dto.image) {
      throw new BadRequestException('Imagem obrigatória');
    }

    this.validateVariants(dto.variants);

    const slug = await this.getUniqueSlug(dto.slug || dto.name);

    const { medias, variants, stock: requestedStock, ...productData } = dto;

    const hasVariants = Boolean(variants?.length);

    const physicalStock = hasVariants
      ? variants!.reduce((sum, variant) => sum + variant.stock, 0)
      : requestedStock;

    return this.prisma.product.create({
      data: {
        ...productData,
        name: dto.name.trim(),
        slug,
        stock: physicalStock,

        medias:
          medias && medias.length > 0
            ? {
                create: medias.map((url) => ({
                  url,
                  type: 'image',
                })),
              }
            : undefined,

        variants: hasVariants
          ? {
              create: variants!.map((variant) => ({
                size: variant.size,
                stock: variant.stock,
              })),
            }
          : undefined,
      },
      include: {
        medias: true,
        variants: true,
        category: true,
      },
    });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAdminProductDto) {
    const existingForSlug = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
      },
    });

    if (!existingForSlug) {
      throw new BadRequestException('Produto não encontrado');
    }

    this.validateVariants(dto.variants);

    const slug = await this.getUniqueSlug(dto.slug || dto.name || existingForSlug.slug, id);

    return this.prisma.$transaction(async (tx) => {
      /**
       * O checkout também serializa reservas através do Product.
       *
       * Esse lock impede uma edição administrativa de estoque de correr
       * simultaneamente com uma nova reserva do mesmo produto.
       */
      await tx.$queryRaw(
        Prisma.sql`SELECT "id"
          FROM "Product"
          WHERE "id" = ${id}
          FOR UPDATE`,
      );

      const current = await tx.product.findUnique({
        where: { id },
        include: {
          medias: true,
          variants: true,
        },
      });

      if (!current) {
        throw new BadRequestException('Produto não encontrado');
      }

      const {
        name,
        description,
        price,
        oldPrice,
        image,
        stock: requestedStock,
        categoryId,
        medias,
        variants,
      } = dto;

      const variantsProvided = variants !== undefined;

      let nextPhysicalStock = current.stock;
      let nextReservedStock = current.reservedStock;

      if (variantsProvided) {
        const incomingVariants = variants ?? [];

        /**
         * Um produto que já possui variantes não pode simplesmente deixar
         * de possuí-las.
         *
         * Os IDs das variantes podem fazer parte do histórico de pedidos e
         * de carrinhos. Removê-los fisicamente quebraria essas referências.
         */
        if (current.variants.length > 0 && incomingVariants.length === 0) {
          throw new BadRequestException(
            'Não é possível remover todas as variações de um produto existente',
          );
        }

        /**
         * Conversão de produto sem variantes para produto com variantes.
         */
        if (current.variants.length === 0 && incomingVariants.length > 0) {
          if (current.reservedStock > 0) {
            throw new BadRequestException(
              'Não é possível criar variações enquanto existem unidades reservadas',
            );
          }

          const cartItems = await tx.cartItem.count({
            where: {
              productId: id,
            },
          });

          if (cartItems > 0) {
            throw new BadRequestException(
              'Não é possível criar variações enquanto o produto está presente em carrinhos',
            );
          }

          await tx.productVariant.createMany({
            data: incomingVariants.map((variant) => ({
              productId: id,
              size: variant.size,
              stock: variant.stock,
            })),
          });

          nextPhysicalStock = incomingVariants.reduce((sum, variant) => sum + variant.stock, 0);
          nextReservedStock = 0;
        } else if (current.variants.length > 0) {
          /**
           * Produto já possui variantes.
           *
           * Preservamos os IDs existentes e atualizamos por tamanho.
           */
          const incomingBySize = new Map(
            incomingVariants.map((variant) => [variant.size, variant.stock]),
          );

          const currentBySize = new Map(current.variants.map((variant) => [variant.size, variant]));

          for (const currentVariant of current.variants) {
            const incomingStock = incomingBySize.get(currentVariant.size);

            /**
             * Tamanho removido do formulário.
             *
             * Não apagamos a linha: zeramos o estoque para preservar
             * referências históricas.
             */
            if (incomingStock === undefined) {
              if (currentVariant.reservedStock > 0) {
                throw new BadRequestException(
                  `Não é possível remover o tamanho ${currentVariant.size} enquanto existem ${currentVariant.reservedStock} unidade(s) reservada(s)`,
                );
              }

              await tx.productVariant.update({
                where: {
                  id: currentVariant.id,
                },
                data: {
                  stock: 0,
                },
              });

              continue;
            }

            if (incomingStock < currentVariant.reservedStock) {
              throw new BadRequestException(
                `O estoque do tamanho ${currentVariant.size} não pode ser menor que as ${currentVariant.reservedStock} unidade(s) reservada(s)`,
              );
            }

            await tx.productVariant.update({
              where: {
                id: currentVariant.id,
              },
              data: {
                stock: incomingStock,
              },
            });
          }

          const newVariants = incomingVariants.filter(
            (variant) => !currentBySize.has(variant.size),
          );

          if (newVariants.length > 0) {
            await tx.productVariant.createMany({
              data: newVariants.map((variant) => ({
                productId: id,
                size: variant.size,
                stock: variant.stock,
              })),
            });
          }

          /**
           * Todas as variantes omitidas ficaram com stock = 0.
           * Portanto o total físico passa a ser exatamente a soma enviada.
           */
          nextPhysicalStock = incomingVariants.reduce((sum, variant) => sum + variant.stock, 0);

          nextReservedStock = current.variants.reduce(
            (sum, variant) => sum + variant.reservedStock,
            0,
          );
        } else {
          /**
           * Produto continua sem variantes.
           */
          const physicalStock = requestedStock ?? current.stock;

          if (physicalStock < current.reservedStock) {
            throw new BadRequestException(
              `O estoque não pode ser menor que as ${current.reservedStock} unidade(s) reservada(s)`,
            );
          }

          nextPhysicalStock = physicalStock;
          nextReservedStock = current.reservedStock;
        }
      } else if (current.variants.length > 0) {
        /**
         * Produto com variantes, mas a requisição não alterou variantes.
         *
         * Ignoramos dto.stock para impedir que Product.stock seja
         * desincronizado das variantes.
         */
        nextPhysicalStock = current.variants.reduce((sum, variant) => sum + variant.stock, 0);

        nextReservedStock = current.variants.reduce(
          (sum, variant) => sum + variant.reservedStock,
          0,
        );
      } else {
        /**
         * Produto sem variantes.
         */
        const physicalStock = requestedStock ?? current.stock;

        if (physicalStock < current.reservedStock) {
          throw new BadRequestException(
            `O estoque não pode ser menor que as ${current.reservedStock} unidade(s) reservada(s)`,
          );
        }

        nextPhysicalStock = physicalStock;
        nextReservedStock = current.reservedStock;
      }

      if (medias !== undefined) {
        await tx.media.deleteMany({
          where: {
            productId: id,
          },
        });
      }

      await tx.product.update({
        where: {
          id,
        },
        data: {
          name: name?.trim() ?? current.name,
          description,
          price,
          oldPrice,
          image,
          categoryId,
          slug,

          /**
           * Estes dois valores são sempre derivados da realidade física
           * e das reservas, nunca confiados diretamente ao painel quando
           * existem variantes.
           */
          stock: nextPhysicalStock,
          reservedStock: nextReservedStock,

          medias:
            medias && medias.length > 0
              ? {
                  create: medias.map((url) => ({
                    url,
                    type: 'image',
                  })),
                }
              : undefined,
        },
      });

      return tx.product.findUnique({
        where: {
          id,
        },
        include: {
          medias: true,
          variants: true,
          category: true,
        },
      });
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw(
        Prisma.sql`SELECT "id"
          FROM "Product"
          WHERE "id" = ${id}
          FOR UPDATE`,
      );

      const product = await tx.product.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          reservedStock: true,
          variants: {
            select: {
              reservedStock: true,
            },
          },
          _count: {
            select: {
              cartItems: true,
              orderItems: true,
            },
          },
        },
      });

      if (!product) {
        throw new BadRequestException('Produto não encontrado');
      }

      const variantReservedStock = product.variants.reduce(
        (sum, variant) => sum + variant.reservedStock,
        0,
      );

      if (product.reservedStock > 0 || variantReservedStock > 0) {
        throw new BadRequestException('Não é possível excluir um produto com unidades reservadas');
      }

      if (product._count.orderItems > 0) {
        throw new BadRequestException(
          'Não é possível excluir um produto que possui histórico de pedidos',
        );
      }

      if (product._count.cartItems > 0) {
        throw new BadRequestException('Não é possível excluir um produto presente em carrinhos');
      }

      return tx.product.delete({
        where: {
          id,
        },
      });
    });
  }
}
