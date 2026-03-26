"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

type Payment = {
  id: string;
  orderId: string;
  method: string;
  status: string;
  amount: number;
  provider?: string | null;
  providerId?: string | null;
  providerRef?: string | null;
  qrCode?: string | null;
  qrCodeText?: string | null;
  cardLast4?: string | null;
  cardBrand?: string | null;
};

type Order = {
  id: string;
  total: number;
  status: string;
};

type Props = {
  params: {
    id: string;
  };
};

function getStatusLabel(status: string) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "approved" || normalized === "paid") {
    return "Pagamento aprovado";
  }

  if (normalized === "pending" || normalized === "waiting") {
    return "Aguardando pagamento";
  }

  if (
    normalized === "declined" ||
    normalized === "rejected" ||
    normalized === "failed"
  ) {
    return "Pagamento recusado";
  }

  if (normalized === "canceled" || normalized === "cancelled") {
    return "Pagamento cancelado";
  }

  return status || "Processando";
}

function getStatusTextClass(status: string) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "approved" || normalized === "paid") {
    return "text-green-400";
  }

  if (
    normalized === "declined" ||
    normalized === "rejected" ||
    normalized === "failed"
  ) {
    return "text-red-400";
  }

  if (normalized === "canceled" || normalized === "cancelled") {
    return "text-red-400";
  }

  return "text-[var(--gold)]";
}

function formatCurrency(value: number) {
  return (value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function PaymentPage({ params }: Props) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);
  const redirectedRef = useRef(false);
  const fetchingRef = useRef(false); // 🔒 evita concorrência

  const loadAll = useCallback(
    async (background = false) => {
      if (!params?.id) return;
      if (fetchingRef.current) return;

      try {
        fetchingRef.current = true;

        if (!background) {
          setLoading(true);
        } else {
          setLoadingRefresh(true);
        }

        setError(null);

        const [paymentData, orderData] = await Promise.all([
          apiFetch<Payment | null>(`/payment/${params.id}`),
          apiFetch<Order | null>(`/orders/order/${params.id}`),
        ]);

        if (!paymentData || !orderData) {
          throw new Error("Dados inválidos");
        }

        setPayment(paymentData);
        setOrder(orderData);
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar os dados do pagamento.");
      } finally {
        fetchingRef.current = false;

        if (!background) {
          setLoading(false);
        } else {
          setLoadingRefresh(false);
        }
      }
    },
    [params.id],
  );

  useEffect(() => {
    if (!params?.id) return;
    void loadAll(false);
  }, [loadAll, params.id]);

  const normalizedPaymentStatus = useMemo(() => {
    if (!payment) return "";
    return (payment.status || "").toLowerCase();
  }, [payment]);

  const normalizedOrderStatus = useMemo(() => {
    if (!order) return "";
    return (order.status || "").toLowerCase();
  }, [order]);

  const isApproved = useMemo(() => {
    return (
      normalizedPaymentStatus === "approved" ||
      normalizedPaymentStatus === "paid" ||
      normalizedOrderStatus === "paid"
    );
  }, [normalizedPaymentStatus, normalizedOrderStatus]);

  const isFailed = useMemo(() => {
    return (
      normalizedPaymentStatus === "failed" ||
      normalizedPaymentStatus === "declined" ||
      normalizedPaymentStatus === "rejected" ||
      normalizedPaymentStatus === "cancelled" ||
      normalizedPaymentStatus === "canceled"
    );
  }, [normalizedPaymentStatus]);

  useEffect(() => {
    if (loading || !payment || !order) return;

    if (isApproved && !redirectedRef.current) {
      redirectedRef.current = true;
      window.location.href = `/order-success/${order.id}`;
      return;
    }

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isApproved && !isFailed) {
      intervalRef.current = window.setInterval(() => {
        void loadAll(true);
      }, 5000);
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [loading, payment, order, isApproved, isFailed, loadAll]);

  async function copyPixCode() {
    if (!payment?.qrCodeText) return;

    try {
      await navigator.clipboard.writeText(payment.qrCodeText);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      alert("Não foi possível copiar o código PIX.");
    }
  }

  async function handleRefresh() {
    if (loadingRefresh) return;
    await loadAll(true);
  }

  if (loading) {
    return (
      <section className="max-w-5xl mx-auto px-6 md:px-8 pt-32 pb-32 text-center">
        <p className="text-white/60">Carregando pagamento...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="max-w-5xl mx-auto px-6 md:px-8 pt-32 pb-32 text-center">
        <p className="text-red-400">{error}</p>

        <button
          onClick={() => void loadAll(false)}
          className="
            mt-6 px-8 py-4 rounded-full
            border border-white/20
            text-xs tracking-[0.35em] uppercase
            hover:border-[var(--gold)] transition
          "
        >
          Tentar novamente
        </button>
      </section>
    );
  }

  if (!payment || !order) {
    return (
      <section className="max-w-5xl mx-auto px-6 md:px-8 pt-32 pb-32 text-center">
        <p className="text-white/60">Pagamento não encontrado.</p>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-6 md:px-8 pt-32 pb-32">
      <p className="text-white/50 uppercase text-xs tracking-[0.4em] mb-4">
        Pagamento do pedido
      </p>

      <h1 className="text-3xl md:text-5xl tracking-widest uppercase bs-title mb-10">
        {payment.method === "pix" ? "Pagar com PIX" : "Pagar com cartão"}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="border border-white/10 rounded-3xl p-6 md:p-8 bg-black/40 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/50 mb-2">
                Status
              </p>

              <p className={`text-lg ${getStatusTextClass(payment.status)}`}>
                {getStatusLabel(payment.status)}
              </p>
            </div>

            <button
              onClick={() => void handleRefresh()}
              disabled={loadingRefresh}
              className="
                px-4 py-2 rounded-full
                border border-white/15
                text-[10px] uppercase tracking-[0.28em]
                text-white/70
                hover:border-[var(--gold)]
                hover:text-white
                transition
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {loadingRefresh ? "Atualizando" : "Atualizar"}
            </button>
          </div>

          <div className="mt-8 space-y-3 text-sm">
            <div className="flex justify-between text-white/70">
              <span>Pedido</span>
              <span>#{order.id ? order.id.slice(0, 8) : "—"}</span>
            </div>

            <div className="flex justify-between text-white/70">
              <span>Método</span>
              <span className="uppercase">{payment.method}</span>
            </div>

            <div className="flex justify-between text-white/70">
              <span>Total</span>
              <span>{formatCurrency(payment.amount)}</span>
            </div>

            <div className="flex justify-between text-white/70">
              <span>Status do pedido</span>
              <span className="uppercase">{order.status}</span>
            </div>

            {payment.provider && (
              <div className="flex justify-between text-white/70">
                <span>Gateway</span>
                <span>{payment.provider}</span>
              </div>
            )}

            {payment.providerId && (
              <div className="flex justify-between text-white/70 gap-4">
                <span>Transação</span>
                <span className="text-right break-all">
                  {payment.providerId}
                </span>
              </div>
            )}
          </div>

          {payment.method === "pix" && payment.qrCode && (
            <div className="mt-10">
              <p className="text-xs uppercase tracking-widest text-white/50 mb-4">
                QR Code PIX
              </p>

              <div className="bg-white rounded-2xl p-4 inline-flex">
                <img
                  src={payment.qrCode}
                  alt="QR Code PIX"
                  className="w-64 h-64 object-contain"
                />
              </div>
            </div>
          )}

          {payment.method === "pix" && !payment.qrCode && (
            <div className="mt-10 border border-white/10 rounded-2xl p-5 bg-white/[0.02]">
              <p className="text-white/60 leading-relaxed">
                O QR Code ainda não foi disponibilizado pelo gateway. Atualize a
                página em instantes.
              </p>
            </div>
          )}
        </div>

        <div className="border border-white/10 rounded-3xl p-6 md:p-8 bg-black/40 backdrop-blur">
          {payment.method === "pix" ? (
            <>
              <p className="text-xs uppercase tracking-widest text-white/50 mb-4">
                Código copia e cola
              </p>

              <div className="border border-white/10 rounded-2xl p-4 bg-white/[0.02]">
                <p className="text-sm text-white/80 break-all leading-relaxed">
                  {payment.qrCodeText || "Código PIX ainda não disponível."}
                </p>
              </div>

              <button
                onClick={copyPixCode}
                disabled={!payment.qrCodeText}
                className="
                  mt-5 w-full py-4 rounded-full
                  bg-[var(--gold)] text-black
                  text-xs tracking-[0.35em] uppercase
                  hover:scale-105 active:scale-[0.98]
                  transition
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {copied ? "Código copiado" : "Copiar código PIX"}
              </button>

              <div className="mt-6 space-y-2 text-sm text-white/60 leading-relaxed">
                <p>
                  Após o pagamento, esta página será atualizada automaticamente.
                </p>
                <p>
                  Assim que o gateway confirmar a transação, você será
                  redirecionado para a confirmação do pedido.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-widest text-white/50 mb-4">
                Cartão
              </p>

              <div className="border border-white/10 rounded-2xl p-5 bg-white/[0.02]">
                <p className="text-white/70 leading-relaxed">
                  O fluxo de cartão será conectado ao SDK do PagBank para
                  criptografia do cartão no navegador e criação da cobrança no
                  backend.
                </p>
              </div>
            </>
          )}

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            {isApproved ? (
              <Link
                href={`/order-success/${order.id}`}
                className="
                  px-8 py-4 rounded-full
                  bg-[var(--gold)] text-black
                  text-xs tracking-[0.35em] uppercase
                  hover:scale-105 transition text-center
                "
              >
                Ver pedido
              </Link>
            ) : (
              <Link
                href="/checkout"
                className="
                  px-8 py-4 rounded-full
                  border border-white/20
                  text-xs tracking-[0.35em] uppercase
                  hover:border-[var(--gold)] transition text-center
                "
              >
                Voltar ao checkout
              </Link>
            )}

            <Link
              href="/catalog"
              className="
                px-8 py-4 rounded-full
                border border-white/20
                text-xs tracking-[0.35em] uppercase
                hover:border-[var(--gold)] transition text-center
              "
            >
              Continuar comprando
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
