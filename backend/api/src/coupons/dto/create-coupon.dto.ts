import { IsString, IsNumber, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsNumber()
  discount!: number;

  @IsNumber()
  maxUses!: number;

  @IsString()
  expiresAt!: string;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
