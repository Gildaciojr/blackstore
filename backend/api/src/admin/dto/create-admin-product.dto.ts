import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductSize } from '@prisma/client';

class AdminProductVariantDto {
  @IsEnum(ProductSize)
  size: ProductSize;

  @IsNumber()
  @Min(0)
  stock: number;
}

export class CreateAdminProductDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  oldPrice?: number;

  @IsString()
  image: string;

  @IsNumber()
  stock: number;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsArray()
  medias?: string[];

  /**
   * 🔥 VARIANTS
   */
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AdminProductVariantDto)
  variants?: AdminProductVariantDto[];
}
