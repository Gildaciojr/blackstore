import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  orderId!: string;

  @IsString()
  @IsIn(['pix', 'card'])
  method!: 'pix' | 'card';

  // CARTÃO
  @IsString()
  @IsOptional()
  cardToken?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  installments?: number;

  @IsString()
  @IsOptional()
  holderName?: string;
}
