import { IsString, IsNumber, IsOptional, IsUUID, Min, IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  oldPrice?: number;

  @IsString()
  image: string;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsUUID()
  categoryId: string;
}
