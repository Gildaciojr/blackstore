export class WebhookPaymentDto {
  id?: string;

  reference_id?: string;

  status?: string;

  charges?: {
    id?: string;
    status?: string;
  }[];
}
