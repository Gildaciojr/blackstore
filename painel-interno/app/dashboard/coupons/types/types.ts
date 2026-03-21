export type Coupon = {
  id: string;
  code: string;
  discount: number;
  maxUses: number;
  used: number;
  expiresAt: string;
};