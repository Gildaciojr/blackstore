import axios from 'axios';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

type CreatePixPayload = {
  referenceId: string;
  amount: number;
  description: string;
  customer: {
    name: string;
    email: string;
    tax_id: string;
    phone?: string | null;
  };
};

type CreateCardPayload = {
  referenceId: string;
  amount: number;
  description: string;
  customer: {
    name: string;
    email: string;
    tax_id: string;
    phone?: string | null;
  };
  cardToken: string;
  installments: number;
  holderName: string;
};

type PagbankCharge = {
  id?: string;
  qr_codes?: {
    text?: string;
    links?: { rel: string; href: string }[];
  }[];
  payment_method?: {
    card?: {
      last_digits?: string;
      brand?: string;
    };
  };
};

type PagbankResponse = {
  charges?: PagbankCharge[];
};

export class PagbankProvider {
  private readonly env = (process.env.PAGBANK_ENV || 'sandbox').toLowerCase();

  private readonly baseUrl =
    this.env === 'production' ? 'https://api.pagseguro.com' : 'https://sandbox.api.pagseguro.com';

  private readonly token = process.env.PAGBANK_TOKEN;

  // Função auxiliar para formatar telefone para o PagBank (DDD + Número)
  private formatPhone(phone?: string | null) {
    if (!phone) return undefined;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return undefined;

    return [
      {
        country: '55',
        area: digits.substring(0, 2),
        number: digits.substring(2),
        type: 'MOBILE',
      },
    ];
  }

  /**
   * =========================
   * PIX
   * =========================
   */
  async createPixPayment(data: CreatePixPayload) {
    if (!this.token) {
      throw new InternalServerErrorException('PAGBANK_TOKEN não configurado no ambiente.');
    }

    if (!data.customer?.tax_id) {
      throw new BadRequestException('CPF/CNPJ é obrigatório para gerar o PIX.');
    }

    const notificationUrl = `${process.env.API_URL}/payment/webhook/${process.env.PAGBANK_WEBHOOK_SECRET}`;
    const cleanCpf = data.customer.tax_id.replace(/\D/g, '');

    const payload = {
      reference_id: data.referenceId,
      notification_urls: [notificationUrl],
      customer: {
        name: data.customer.name,
        email: data.customer.email,
        tax_id: [
          {
            tax_id: cleanCpf,
            type: cleanCpf.length === 14 ? 'CNPJ' : 'CPF',
          },
        ],
        phones: this.formatPhone(data.customer.phone),
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
    };

    console.log('\n=========================================');
    console.log('[PAGBANK] - INICIANDO REQUISIÇÃO PIX');
    console.log('[PAGBANK] - REQUEST PAYLOAD:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('=========================================\n');

    try {
      const response = await axios.post<PagbankResponse>(`${this.baseUrl}/orders`, payload, {
        timeout: 15000,
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('\n=========================================');
      console.log('[PAGBANK] - SUCESSO NA REQUISIÇÃO PIX');
      console.log('[PAGBANK] - RESPONSE PAYLOAD:');
      console.log(JSON.stringify(response.data, null, 2));
      console.log('=========================================\n');

      const charge = response.data?.charges?.[0];

      return {
        providerId: charge?.id ?? null,
        qrCode: charge?.qr_codes?.[0]?.links?.find((l) => l.rel === 'QRCODE')?.href ?? null,
        qrCodeText: charge?.qr_codes?.[0]?.text ?? null,
      };
    } catch (error: unknown) {
      console.error('\n=========================================');
      console.error('[PAGBANK] - ERRO NA REQUISIÇÃO PIX');
      console.error('[PAGBANK] - RESPONSE ERROR:');
      if (axios.isAxiosError(error)) {
        console.error(JSON.stringify(error.response?.data || error.message, null, 2));
      } else if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error(error);
      }
      console.error('=========================================\n');
      throw error;
    }
  }

  /**
   * =========================
   * CARTÃO (REAL)
   * =========================
   */
  async createCardPayment(data: CreateCardPayload) {
    if (!this.token) {
      throw new InternalServerErrorException('PAGBANK_TOKEN não configurado.');
    }

    if (!data.customer?.tax_id) {
      throw new BadRequestException('CPF/CNPJ é obrigatório para pagamentos via cartão.');
    }

    const notificationUrl = `${process.env.API_URL}/payment/webhook/${process.env.PAGBANK_WEBHOOK_SECRET}`;
    const cleanCpf = data.customer.tax_id.replace(/\D/g, '');

    const payload = {
      reference_id: data.referenceId,
      notification_urls: [notificationUrl],
      customer: {
        name: data.customer.name,
        email: data.customer.email,
        tax_id: [
          {
            tax_id: cleanCpf,
            type: cleanCpf.length === 14 ? 'CNPJ' : 'CPF',
          },
        ],
        phones: this.formatPhone(data.customer.phone),
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
            type: 'CREDIT_CARD',
            installments: data.installments,
            card: {
              encrypted: data.cardToken,
              holder: {
                name: data.holderName,
              },
            },
          },
        },
      ],
    };

    console.log('\n=========================================');
    console.log('[PAGBANK] - INICIANDO REQUISIÇÃO CARTÃO');
    console.log('[PAGBANK] - REQUEST PAYLOAD:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('=========================================\n');

    try {
      const response = await axios.post<PagbankResponse>(`${this.baseUrl}/orders`, payload, {
        timeout: 15000,
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('\n=========================================');
      console.log('[PAGBANK] - SUCESSO NA REQUISIÇÃO CARTÃO');
      console.log('[PAGBANK] - RESPONSE PAYLOAD:');
      console.log(JSON.stringify(response.data, null, 2));
      console.log('=========================================\n');

      const charge = response.data?.charges?.[0];

      return {
        providerId: charge?.id ?? null,
        qrCode: null,
        qrCodeText: null,
        cardLast4: charge?.payment_method?.card?.last_digits ?? null,
        cardBrand: charge?.payment_method?.card?.brand ?? null,
      };
    } catch (error: unknown) {
      console.error('\n=========================================');
      console.error('[PAGBANK] - ERRO NA REQUISIÇÃO CARTÃO');
      console.error('[PAGBANK] - RESPONSE ERROR:');
      if (axios.isAxiosError(error)) {
        console.error(JSON.stringify(error.response?.data || error.message, null, 2));
      } else if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error(error);
      }
      console.error('=========================================\n');
      throw error;
    }
  }
}
