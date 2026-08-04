import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  street!: string;

  @IsString()
  @IsNotEmpty()
  number!: string;

  @IsString()
  @IsOptional()
  complement?: string;

  @IsString()
  @IsNotEmpty()
  district!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 2, { message: 'A UF deve ter exatamente 2 caracteres' })
  state!: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 8, { message: 'O CEP deve conter apenas os 8 números' })
  zipCode!: string;
}
