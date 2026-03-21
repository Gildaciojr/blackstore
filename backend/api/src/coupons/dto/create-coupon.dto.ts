export class CreateCouponDto {
  code: string;
  discount: number;
  maxUses: number;
  expiresAt: string;
}
