import { IsString, Matches } from 'class-validator';

export class CalculateShippingDto {
  @IsString()
  @Matches(/^\d{5}-?\d{3}$/, {
    message: 'CEP inválido',
  })
  cep: string;
}
