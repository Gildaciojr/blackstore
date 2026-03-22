export class WebhookPaymentDto {
  id: string;

  reference_id: string;

  charges: {
    id: string;
    status: string;
  }[];
}
