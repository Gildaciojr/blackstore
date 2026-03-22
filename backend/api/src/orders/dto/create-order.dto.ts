import { IsString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  customerId: string;

  @IsUUID()
  addressId: string;

  @IsNumber()
  @Min(0)
  shippingPrice: number;

  @IsString()
  shippingMethod: string;

  @IsString()
  shippingName: string;

  @IsString()
  shippingDeadline: string;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
