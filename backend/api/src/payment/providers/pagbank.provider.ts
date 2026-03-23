import axios from 'axios';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

type CreatePixPayload = {
  referenceId: string;
  amount: number;
  description: string;
  customer: {
    name: string;
    email: string;
  };
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
  private readonly env = (process.env.PAGBANK_ENV || 'sandbox').toLowerCase();

  private readonly baseUrl =
    this.env === 'production' ? 'https://api.pagseguro.com' : 'https://sandbox.api.pagseguro.com';

  private readonly token = process.env.PAGBANK_TOKEN;

  async createPixPayment(data: CreatePixPayload) {
    if (!this.token) {
      throw new InternalServerErrorException('PAGBANK_TOKEN não configurado no ambiente.');
    }

    if (!data.referenceId?.trim()) {
      throw new BadRequestException('referenceId é obrigatório.');
    }

    if (!data.description?.trim()) {
      throw new BadRequestException('description é obrigatória.');
    }

    if (!data.customer?.name?.trim()) {
      throw new BadRequestException('Nome do cliente é obrigatório.');
    }

    if (!data.customer?.email?.trim()) {
      throw new BadRequestException('Email do cliente é obrigatório.');
    }

    if (!data.amount || data.amount <= 0) {
      throw new BadRequestException('amount deve ser maior que zero.');
    }

    const notificationUrl = `${process.env.API_URL}/payment/webhook/${process.env.PAGBANK_WEBHOOK_SECRET}`;

    const response = await axios.post<PagbankResponse>(
      `${this.baseUrl}/orders`,
      {
        reference_id: data.referenceId,

        /**
         * 🔥 WEBHOOK AQUI (CRÍTICO)
         */
        notification_urls: [notificationUrl],

        customer: {
          name: data.customer.name,
          email: data.customer.email,
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
        timeout: 15000,
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
