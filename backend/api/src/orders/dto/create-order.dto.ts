export class CreateOrderDto {
  customerId: string;

  addressId: string;

  shippingPrice: number;
  shippingMethod: string;
  shippingName: string;
  shippingDeadline: string;

  couponCode?: string;
}
