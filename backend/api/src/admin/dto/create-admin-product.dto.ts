import { IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';

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
}
