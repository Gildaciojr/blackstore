export class CreatePaymentDto {
  orderId: string;
  method: 'pix' | 'card';

  // CARTÃO
  cardToken?: string;
  installments?: number;
  holderName?: string;
}
