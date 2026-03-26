import { IsInt, IsUUID, Min } from 'class-validator';

export class UpdateCartDto {
  @IsUUID()
  cartItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
