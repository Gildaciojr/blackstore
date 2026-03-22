import axios from 'axios';

type CreatePixPayload = {
  referenceId: string;
  amount: number;
  description: string;
};

type PagbankCharge = {
  id?: string;
  qr_codes?: {
    text?: string;
    links?: { rel: string; href: string }[];
  }[];
};

type PagbankResponse = {
  charges?: PagbankCharge[];
};

export class PagbankProvider {
  private baseUrl = 'https://sandbox.api.pagseguro.com';

  private token = process.env.PAGBANK_TOKEN;

  async createPixPayment(data: CreatePixPayload) {
    const response = await axios.post<PagbankResponse>(
      `${this.baseUrl}/orders`,
      {
        reference_id: data.referenceId,

        /**
         * 🔥 WEBHOOK AQUI (CRÍTICO)
         */
        notification_urls: [
          `${process.env.API_URL}/payment/webhook/${process.env.PAGBANK_WEBHOOK_SECRET}`,
        ],

        customer: {
          name: 'Cliente Blackstore',
          email: 'cliente@blackstore.com',
        },

        items: [
          {
            name: data.description,
            quantity: 1,
            unit_amount: Math.round(data.amount * 100),
          },
        ],

        charges: [
          {
            reference_id: data.referenceId,
            description: data.description,
            amount: {
              value: Math.round(data.amount * 100),
              currency: 'BRL',
            },
            payment_method: {
              type: 'PIX',
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const order = response.data;
    const charge = order.charges?.[0];

    return {
      providerId: charge?.id ?? null,
      qrCode: charge?.qr_codes?.[0]?.links?.find((l) => l.rel === 'QRCODE')?.href ?? null,
      qrCodeText: charge?.qr_codes?.[0]?.text ?? null,
    };
  }
}
