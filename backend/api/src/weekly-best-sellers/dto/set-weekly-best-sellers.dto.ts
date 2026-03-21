import { IsInt, IsString, Min, Max } from 'class-validator';

export class SetWeeklyBestSellersDto {
  @IsInt()
  @Min(1)
  @Max(4)
  position: number;

  @IsString()
  productId: string;
}
