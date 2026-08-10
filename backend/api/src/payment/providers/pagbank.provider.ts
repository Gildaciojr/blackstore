import axios from 'axios';
import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { createHash } from 'crypto';

type PagbankCustomer = {
  name: string;
  email: string;
  tax_id: string;
  phone?: string | null;
};

type CreatePixPayload = {
  referenceId: string;
  amountInCents: number;
  description: string;
  customer: PagbankCustomer;
  idempotencyKey: string;
  expirationDate?: string;
};

type CreateCardPayload = CreatePixPayload & {
  cardToken: string;
  installments: number;
  holderName: string;
};

type PagbankLink = {
  rel?: string;
  href?: string;
  media?: string;
  type?: string;
};

type PagbankQrCode = {
  id?: string;
  expiration_date?: string;
  text?: string;
  amount?: {
    value?: number;
  };
  links?: PagbankLink[];
};

type PagbankCharge = {
  id?: string;
  status?: string;
  amount?: {
    value?: number;
    currency?: string;
  };
  payment_method?: {
    card?: {
      last_digits?: string;
      brand?: string;
    };
  };
};

type PagbankResponse = {
  id?: string;
  reference_id?: string;
  qr_codes?: PagbankQrCode[];
  charges?: PagbankCharge[];
};

export type PagbankPaymentStatus = 'pending' | 'paid' | 'failed';

export type PagbankPaymentResult = {
  providerRef: string;
  providerId: string | null;
  status: PagbankPaymentStatus;
  providerAmountCents: number | null;
  qrCode: string | null;
  qrCodeText: string | null;
  qrCodeId: string | null;
  qrCodeExpiration: string | null;
  cardLast4: string | null;
  cardBrand: string | null;
};

export type PagbankOrderResult = PagbankPaymentResult & {
  referenceId: string | null;
  providerStatus: string;
  currency: string | null;
};

class PagbankUnknownResultError extends InternalServerErrorException {
  readonly pagbankResultUnknown = true;
}

export function createPagbankIdempotencyKey(orderId: string, method: 'pix' | 'card'): string {
  return createHash('sha256').update(`blackstore:${orderId}:${method}`).digest('hex');
}

export function mapPagbankStatus(status?: string): PagbankPaymentStatus {
  if (status === 'PAID') return 'paid';
  if (status === 'DECLINED' || status === 'CANCELED' || status === 'CANCELLED') {
    return 'failed';
  }

  return 'pending';
}

export function isSupportedPagbankStatus(status?: string): boolean {
  return [
    'AUTHORIZED',
    'PAID',
    'IN_ANALYSIS',
    'DECLINED',
    'CANCELED',
    'CANCELLED',
    'WAITING',
  ].includes(status ?? '');
}

export function isPagbankResultUnknown(error: unknown): boolean {
  if (
    typeof error === 'object' &&
    error !== null &&
    'pagbankResultUnknown' in error &&
    error.pagbankResultUnknown === true
  ) {
    return true;
  }

  if (typeof error !== 'object' || error === null || !('isAxiosError' in error)) return false;

  const axiosError = error as { response?: { status: number; data?: unknown } };
  if (!axiosError.response) return true;

  const status = axiosError.response.status;
  const responseData = axiosError.response.data;
  const responseCode =
    typeof responseData === 'object' && responseData !== null && 'code' in responseData
      ? String((responseData as { code: unknown }).code)
      : null;

  return (
    status === 408 ||
    status === 409 ||
    status === 429 ||
    status >= 500 ||
    responseCode === '40005' ||
    responseCode === 'idempotency_key_in_use'
  );
}

export class PagbankProvider {
  private readonly logger = new Logger(PagbankProvider.name);
  private readonly env = (process.env.PAGBANK_ENV || 'sandbox').toLowerCase();

  private readonly baseUrl =
    this.env === 'production' ? 'https://api.pagseguro.com' : 'https://sandbox.api.pagseguro.com';

  private readonly token = process.env.PAGBANK_TOKEN;

  private logRequestStarted(event: string, referenceId: string) {
    this.logger.log(
      JSON.stringify({
        event,
        environment: this.env,
        method: 'POST',
        endpoint: '/orders',
        referenceId,
      }),
    );
  }

  private logRequestSucceeded(
    event: string,
    referenceId: string,
    startedAt: number,
    response: { status: number; data: PagbankResponse },
  ) {
    const charge = response.data.charges?.[0];

    this.logger.log(
      JSON.stringify({
        event,
        environment: this.env,
        method: 'POST',
        endpoint: '/orders',
        referenceId,
        httpStatus: response.status,
        pagbankOrderId: response.data.id ?? null,
        chargeId: charge?.id ?? null,
        transactionStatus: charge?.status ?? null,
        durationMs: Date.now() - startedAt,
      }),
    );
  }

  private logRequestFailed(event: string, referenceId: string, startedAt: number, error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown }; code?: string };
    const responseData = err.response?.data;
    const responseCode =
      typeof responseData === 'object' && responseData !== null && 'code' in responseData
        ? String((responseData as { code: unknown }).code)
        : null;

    this.logger.error(
      JSON.stringify({
        event,
        environment: this.env,
        method: 'POST',
        endpoint: '/orders',
        referenceId,
        httpStatus: err.response?.status ?? null,
        errorCode: responseCode ?? err.code ?? null,
        durationMs: Date.now() - startedAt,
      }),
    );
  }

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

  private validateRequest(data: CreatePixPayload) {
    if (!this.token) {
      throw new InternalServerErrorException('PAGBANK_TOKEN não configurado no ambiente.');
    }

    if (!data.customer?.tax_id) {
      throw new BadRequestException('CPF/CNPJ é obrigatório para pagamentos PagBank.');
    }

    if (!Number.isInteger(data.amountInCents) || data.amountInCents <= 0) {
      throw new BadRequestException('Valor em centavos inválido para o PagBank.');
    }
  }

  private requestConfig(idempotencyKey: string) {
    return {
      timeout: 15000,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'x-idempotency-key': idempotencyKey,
      },
    };
  }

  private readRequestConfig() {
    return {
      timeout: 15000,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };
  }

  async getOrder(orderId: string): Promise<PagbankOrderResult> {
    if (!this.token) {
      throw new InternalServerErrorException('PAGBANK_TOKEN não configurado no ambiente.');
    }
    if (!orderId.startsWith('ORDE_')) {
      throw new BadRequestException('PagBank Order ID inválido.');
    }

    const startedAt = Date.now();
    this.logger.log(
      JSON.stringify({ event: 'pagbank.reconciliation.started', environment: this.env, orderId }),
    );
    try {
      const response = await axios.get<PagbankResponse>(
        `${this.baseUrl}/orders/${encodeURIComponent(orderId)}`,
        this.readRequestConfig(),
      );
      const charge = response.data.charges?.[0];
      const qrCode = response.data.qr_codes?.[0];
      const rawStatus = charge?.status ?? 'WAITING';
      const imageLink = qrCode?.links?.find(
        (link) => link.media === 'image/png' || link.rel === 'QRCODE.PNG',
      );
      this.logger.log(
        JSON.stringify({
          event: 'pagbank.reconciliation.succeeded',
          environment: this.env,
          orderId,
          httpStatus: response.status,
          providerStatus: rawStatus,
          durationMs: Date.now() - startedAt,
        }),
      );
      return {
        providerRef: response.data.id ?? orderId,
        providerId: charge?.id ?? null,
        referenceId: response.data.reference_id ?? null,
        providerStatus: rawStatus,
        status: mapPagbankStatus(rawStatus),
        providerAmountCents: charge?.amount?.value ?? qrCode?.amount?.value ?? null,
        currency: charge?.amount?.currency ?? 'BRL',
        qrCode: imageLink?.href ?? null,
        qrCodeText: qrCode?.text ?? null,
        qrCodeId: qrCode?.id ?? null,
        qrCodeExpiration: qrCode?.expiration_date ?? null,
        cardLast4: charge?.payment_method?.card?.last_digits ?? null,
        cardBrand: charge?.payment_method?.card?.brand ?? null,
      };
    } catch (error: unknown) {
      this.logRequestFailed('pagbank.reconciliation.failed', orderId, startedAt, error);
      throw error;
    }
  }

  async createPixPayment(data: CreatePixPayload): Promise<PagbankPaymentResult> {
    this.validateRequest(data);

    const notificationUrl = `${process.env.API_URL}/payment/webhook/${process.env.PAGBANK_WEBHOOK_SECRET}`;
    const cleanCpf = data.customer.tax_id.replace(/\D/g, '');
    const expirationDate =
      data.expirationDate ?? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const payload = {
      reference_id: data.referenceId,
      notification_urls: [notificationUrl],
      customer: {
        name: data.customer.name,
        email: data.customer.email,
        tax_id: cleanCpf,
        phones: this.formatPhone(data.customer.phone),
      },
      items: [
        {
          reference_id: data.referenceId,
          name: data.description,
          quantity: 1,
          unit_amount: data.amountInCents,
        },
      ],
      qr_codes: [
        {
          amount: { value: data.amountInCents },
          expiration_date: expirationDate,
        },
      ],
    };

    const startedAt = Date.now();
    this.logRequestStarted('pagbank.pix.request.started', data.referenceId);

    try {
      const response = await axios.post<PagbankResponse>(
        `${this.baseUrl}/orders`,
        payload,
        this.requestConfig(data.idempotencyKey),
      );
      this.logRequestSucceeded(
        'pagbank.pix.request.succeeded',
        data.referenceId,
        startedAt,
        response,
      );

      if (!response.data.id) {
        throw new PagbankUnknownResultError('PagBank response is missing the Order ID.');
      }

      const qrCode = response.data.qr_codes?.[0];
      const imageLink = qrCode?.links?.find(
        (link) => link.media === 'image/png' || link.rel === 'QRCODE.PNG',
      );

      return {
        providerRef: response.data.id,
        providerId: null,
        status: 'pending',
        providerAmountCents: qrCode?.amount?.value ?? null,
        qrCode: imageLink?.href ?? null,
        qrCodeText: qrCode?.text ?? null,
        qrCodeId: qrCode?.id ?? null,
        qrCodeExpiration: qrCode?.expiration_date ?? null,
        cardLast4: null,
        cardBrand: null,
      };
    } catch (error: unknown) {
      this.logRequestFailed('pagbank.pix.request.failed', data.referenceId, startedAt, error);
      throw error;
    }
  }

  async createCardPayment(data: CreateCardPayload): Promise<PagbankPaymentResult> {
    this.validateRequest(data);

    const notificationUrl = `${process.env.API_URL}/payment/webhook/${process.env.PAGBANK_WEBHOOK_SECRET}`;
    const cleanCpf = data.customer.tax_id.replace(/\D/g, '');
    const payload = {
      reference_id: data.referenceId,
      notification_urls: [notificationUrl],
      customer: {
        name: data.customer.name,
        email: data.customer.email,
        tax_id: cleanCpf,
        phones: this.formatPhone(data.customer.phone),
      },
      items: [
        {
          reference_id: data.referenceId,
          name: data.description,
          quantity: 1,
          unit_amount: data.amountInCents,
        },
      ],
      charges: [
        {
          reference_id: data.referenceId,
          description: data.description,
          amount: {
            value: data.amountInCents,
            currency: 'BRL',
          },
          payment_method: {
            type: 'CREDIT_CARD',
            capture: true,
            installments: data.installments,
            card: {
              encrypted: data.cardToken,
            },
            holder: {
              name: data.holderName,
              tax_id: cleanCpf,
            },
          },
        },
      ],
    };

    const startedAt = Date.now();
    this.logRequestStarted('pagbank.card.request.started', data.referenceId);

    try {
      const response = await axios.post<PagbankResponse>(
        `${this.baseUrl}/orders`,
        payload,
        this.requestConfig(data.idempotencyKey),
      );
      this.logRequestSucceeded(
        'pagbank.card.request.succeeded',
        data.referenceId,
        startedAt,
        response,
      );

      if (!response.data.id) {
        throw new PagbankUnknownResultError('PagBank response is missing the Order ID.');
      }

      const charge = response.data.charges?.[0];

      return {
        providerRef: response.data.id,
        providerId: charge?.id ?? null,
        status: mapPagbankStatus(charge?.status),
        providerAmountCents: charge?.amount?.value ?? null,
        qrCode: null,
        qrCodeText: null,
        qrCodeId: null,
        qrCodeExpiration: null,
        cardLast4: charge?.payment_method?.card?.last_digits ?? null,
        cardBrand: charge?.payment_method?.card?.brand ?? null,
      };
    } catch (error: unknown) {
      this.logRequestFailed('pagbank.card.request.failed', data.referenceId, startedAt, error);
      throw error;
    }
  }
}
