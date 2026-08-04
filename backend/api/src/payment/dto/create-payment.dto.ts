import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

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

  @IsNumber()
  @IsOptional()
  installments?: number;

  @IsString()
  @IsOptional()
  holderName?: string;
}
