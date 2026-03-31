export type ShippingRate = {
  id: string;
  name: string;
  method: string;
  price: number;
  minDays: number;
  maxDays: number;
  cepPrefix?: string | null;
  state?: string | null;
  createdAt: string;
};
