"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import {
  Copy,
  Check,
  RefreshCw,
  QrCode,
  CreditCard,
  AlertCircle,
} from "lucide-react";

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
  const fetchingRef = useRef(false);

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

      setTimeout(() => {
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
      <section className="min-h-screen flex flex-col items-center justify-center pt-20 px-6 bg-[#0b0b0d]">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white/60 text-xs tracking-widest uppercase">
          Carregando pagamento...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-screen flex flex-col items-center justify-center pt-20 px-6 text-center bg-[#0b0b0d]">
        <AlertCircle className="text-red-400 w-12 h-12 mb-4" />
        <p className="text-red-400 mb-6">{error}</p>

        <button
          onClick={() => void loadAll(false)}
          className="
            px-8 py-4 rounded-full
            border border-white/20
            text-xs tracking-[0.35em] uppercase text-white/90
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
      <section className="min-h-screen flex flex-col items-center justify-center pt-20 px-6 text-center bg-[#0b0b0d]">
        <p className="text-white/60">Pagamento não encontrado.</p>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-32 pb-32 bg-[#0b0b0d]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
        <p className="text-white/50 uppercase text-[10px] md:text-xs tracking-[0.4em] mb-4">
          Status do Pedido
        </p>

        <h1 className="flex items-center gap-3 text-3xl md:text-5xl tracking-widest uppercase bs-title mb-10">
          {payment.method === "pix" ? (
            <QrCode className="text-[var(--gold)] w-8 h-8 md:w-10 md:h-10" />
          ) : (
            <CreditCard className="text-[var(--gold)] w-8 h-8 md:w-10 md:h-10" />
          )}
          <span>{payment.method === "pix" ? "Pagar via PIX" : "Cartão"}</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
          {/* DETALHES DO PAGAMENTO */}
          <div className="border border-white/10 rounded-3xl p-6 md:p-8 bg-white/[0.02] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-6 mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/50 mb-2">
                  Status da Transação
                </p>
                <p
                  className={`text-lg md:text-xl font-medium tracking-wide ${getStatusTextClass(payment.status)}`}
                >
                  {getStatusLabel(payment.status)}
                </p>
              </div>

              <button
                onClick={() => void handleRefresh()}
                disabled={loadingRefresh}
                className="
                  flex items-center gap-2
                  px-4 py-2.5 rounded-full
                  border border-white/15 bg-black/50
                  text-[10px] uppercase tracking-[0.2em]
                  text-white/70
                  hover:border-[var(--gold)] hover:text-[var(--gold)]
                  transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <RefreshCw
                  size={14}
                  className={loadingRefresh ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">
                  {loadingRefresh ? "Atualizando" : "Atualizar"}
                </span>
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center text-white/70">
                <span>Nº do Pedido</span>
                <span className="font-mono text-white">
                  #{order.id ? order.id.slice(0, 8) : "—"}
                </span>
              </div>

              <div className="flex justify-between items-center text-white/70">
                <span>Método</span>
                <span className="uppercase text-white">{payment.method}</span>
              </div>

              <div className="flex justify-between items-center text-white/70">
                <span>Total a Pagar</span>
                <span className="text-[var(--gold)] font-medium text-base">
                  {formatCurrency(payment.amount)}
                </span>
              </div>

              {payment.provider && (
                <div className="flex justify-between items-center text-white/70">
                  <span>Gateway</span>
                  <span className="text-white">{payment.provider}</span>
                </div>
              )}

              {payment.providerId && (
                <div className="flex justify-between items-start text-white/70 gap-4 mt-2 pt-4 border-t border-white/5">
                  <span>Transação ID</span>
                  <span className="text-right text-xs break-all text-white/50 font-mono">
                    {payment.providerId}
                  </span>
                </div>
              )}
            </div>

            {/* QR CODE DISPLAY */}
            {payment.method === "pix" && payment.qrCode && (
              <div className="mt-8 flex flex-col items-center">
                <p className="text-[10px] uppercase tracking-widest text-white/50 mb-4 w-full text-left">
                  Escaneie o QR Code
                </p>

                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] inline-block">
                  <img
                    src={payment.qrCode}
                    alt="QR Code PIX"
                    className="w-48 h-48 md:w-56 md:h-56 object-contain"
                  />
                </div>
              </div>
            )}

            {payment.method === "pix" && !payment.qrCode && (
              <div className="mt-8 border border-white/10 rounded-2xl p-5 bg-white/[0.02] flex items-center gap-3">
                <AlertCircle className="text-white/40 shrink-0" />
                <p className="text-white/60 text-xs md:text-sm leading-relaxed">
                  O QR Code ainda não foi disponibilizado pelo banco. Aguarde ou
                  atualize a página.
                </p>
              </div>
            )}
          </div>

          {/* ÁREA DE AÇÃO */}
          <div className="flex flex-col">
            <div className="border border-white/10 rounded-3xl p-6 md:p-8 bg-white/[0.02] backdrop-blur-xl flex-1">
              {payment.method === "pix" ? (
                <>
                  <p className="text-[10px] uppercase tracking-widest text-white/50 mb-4">
                    Pix Copia e Cola
                  </p>

                  <div className="border border-white/10 rounded-2xl p-4 bg-black/50 relative group">
                    <p className="text-xs md:text-sm text-white/80 break-all leading-relaxed font-mono">
                      {payment.qrCodeText || "Código PIX ainda não disponível."}
                    </p>
                  </div>

                  <button
                    onClick={copyPixCode}
                    disabled={!payment.qrCodeText}
                    className={`
                      mt-5 w-full py-4 rounded-full flex items-center justify-center gap-3
                      text-xs tracking-[0.35em] uppercase font-medium transition-all duration-300
                      ${
                        copied
                          ? "bg-green-500 text-black border-transparent shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                          : "bg-[var(--gold)] text-black hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      }
                    `}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? "Código copiado" : "Copiar código PIX"}
                  </button>

                  <div className="mt-8 p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs md:text-sm text-white/50 leading-relaxed">
                    <p>
                      ✦ Após o pagamento, esta página será atualizada
                      automaticamente.
                    </p>
                    <p>
                      ✦ Assim que o banco confirmar a transação, você será
                      redirecionado.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[10px] uppercase tracking-widest text-white/50 mb-4">
                    Pagamento via Cartão
                  </p>

                  <div className="border border-white/10 rounded-2xl p-6 bg-black/50 flex flex-col items-center justify-center text-center gap-4 h-48">
                    <CreditCard className="text-white/20 w-12 h-12" />
                    <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                      Sua transação está sendo processada de forma segura e
                      criptografada.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* BOTÕES INFERIORES */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full">
              {isApproved ? (
                <Link
                  href={`/order-success/${order.id}`}
                  className="
                    w-full
                    px-8 py-4 rounded-full
                    bg-[var(--gold)] text-black
                    text-xs tracking-[0.35em] uppercase font-medium
                    hover:scale-[1.02] active:scale-[0.98] transition text-center
                  "
                >
                  Ver pedido confirmado
                </Link>
              ) : (
                <Link
                  href="/checkout"
                  className="
                    w-full sm:w-1/2
                    px-8 py-4 rounded-full
                    border border-white/20 bg-black
                    text-xs tracking-[0.35em] uppercase text-white/90
                    hover:border-[var(--gold)] transition text-center
                  "
                >
                  Voltar
                </Link>
              )}

              {!isApproved && (
                <Link
                  href="/catalog"
                  className="
                    w-full sm:w-1/2
                    px-8 py-4 rounded-full
                    bg-white/5 border border-transparent text-white
                    text-xs tracking-[0.35em] uppercase
                    hover:bg-white/10 transition text-center
                  "
                >
                  Catálogo
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
