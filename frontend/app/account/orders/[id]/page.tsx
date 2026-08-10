"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  ReceiptText,
  Truck,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

type Product = {
  id: string;
  name: string;
  image: string;
};

type ProductVariant = {
  id: string;
  size: string;
};

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  size?: string | null;
  product: Product;
  variant?: ProductVariant | null;
};

type Address = {
  id: string;
  name: string;
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
  zipCode: string;
};

type Payment = {
  id: string;
  method: string;
  status: string;
  amount: number;
  provider?: string | null;
  providerId?: string | null;
  providerRef?: string | null;
  cardLast4?: string | null;
  cardBrand?: string | null;
  installments?: number | null;
};

type Order = {
  id: string;
  subtotal: number;
  shippingPrice: number;
  discount: number;
  total: number;
  couponCode?: string | null;
  shippingName?: string | null;
  shippingMethod?: string | null;
  shippingDeadline?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  address?: Address | null;
  items: OrderItem[];
  payment?: Payment | null;
};

function resolveImage(url?: string | null) {
  if (!url) return "/images/placeholder.png";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/images")) return url;

  return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
}

function formatCurrency(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return date.toLocaleDateString("pt-BR");
}

function getStatusLabel(status: string) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "paid") return "Pagamento aprovado";
  if (normalized === "pending") return "Aguardando pagamento";
  if (normalized === "shipped") return "Pedido enviado";
  if (normalized === "delivered") return "Entregue";

  if (normalized === "canceled" || normalized === "cancelled") {
    return "Cancelado";
  }

  return status || "Processando";
}

function getStatusClasses(status: string) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "paid") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (normalized === "shipped") {
    return "border-sky-400/30 bg-sky-400/10 text-sky-300";
  }

  if (normalized === "delivered") {
    return "border-green-400/30 bg-green-400/10 text-green-300";
  }

  if (normalized === "canceled" || normalized === "cancelled") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)]";
}

function getPaymentMethodLabel(payment?: Payment | null) {
  if (!payment?.method) return "Não informado";

  const method = payment.method.toLowerCase();

  if (method === "pix") return "PIX";
  if (method === "card") return "Cartão";

  return payment.method;
}

function getPaymentStatusLabel(payment?: Payment | null) {
  if (!payment?.status) return "Não informado";

  const status = payment.status.toLowerCase();

  if (status === "paid") return "Pago";
  if (status === "pending") return "Pendente";
  if (status === "processing") return "Processando";
  if (status === "failed") return "Falhou";

  return payment.status;
}

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    async function loadOrder() {
      try {
        setLoading(true);
        setError(null);

        const data = await apiFetch<Order>(`/orders/order/${orderId}`);

        setOrder(data);
      } catch (err) {
        console.error("Erro ao carregar pedido:", err);
        setError("Não foi possível carregar os detalhes deste pedido.");
      } finally {
        setLoading(false);
      }
    }

    void loadOrder();
  }, [orderId]);

  const totalItems = useMemo(() => {
    if (!order) return 0;

    return order.items.reduce((total, item) => total + item.quantity, 0);
  }, [order]);

  if (loading) {
    return (
      <section className="min-h-screen px-4 sm:px-6 md:px-8 pt-28 sm:pt-32 md:pt-40 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[45vh]">
            <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin mb-4" />

            <p className="text-white/50 text-[10px] sm:text-xs uppercase tracking-[0.3em]">
              Carregando pedido...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="min-h-screen px-4 sm:px-6 md:px-8 pt-28 sm:pt-32 md:pt-40 pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <Package className="w-12 h-12 text-white/20 mx-auto mb-5" />

          <h1 className="text-2xl sm:text-3xl uppercase tracking-widest bs-title">
            Pedido não encontrado
          </h1>

          <p className="mt-4 text-sm text-white/50 leading-relaxed">
            {error || "Não foi possível localizar este pedido."}
          </p>

          <Link
            href="/account/orders"
            className="
              inline-flex items-center justify-center gap-2
              mt-7 px-7 py-3.5 rounded-full
              border border-white/15
              text-[10px] sm:text-xs uppercase tracking-[0.3em]
              text-white/80
              transition hover:border-[var(--gold)]
            "
          >
            <ArrowLeft size={15} />
            Voltar aos pedidos
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen px-4 sm:px-6 md:px-8 pt-28 sm:pt-32 md:pt-40 pb-24 md:pb-32">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/account/orders"
          className="
            inline-flex items-center gap-2
            text-[10px] sm:text-xs uppercase tracking-[0.25em]
            text-white/45 hover:text-[var(--gold)]
            transition mb-7
          "
        >
          <ArrowLeft size={15} />
          Voltar aos pedidos
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8 md:mb-10">
          <div>
            <p className="text-[var(--gold)] text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-3">
              Detalhes do pedido
            </p>

            <h1 className="text-3xl sm:text-4xl md:text-5xl uppercase tracking-widest bs-title">
              Pedido #{order.id.slice(0, 8)}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-white/45">
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={14} />
                {formatDate(order.createdAt)}
              </span>

              <span>•</span>

              <span>
                {totalItems} {totalItems === 1 ? "item" : "itens"}
              </span>
            </div>
          </div>

          <div
            className={`
              inline-flex self-start lg:self-auto
              rounded-full border
              px-4 py-2
              text-[10px] sm:text-xs
              uppercase tracking-[0.2em]
              ${getStatusClasses(order.status)}
            `}
          >
            {getStatusLabel(order.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 md:gap-8">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 md:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center">
                  <Package size={17} className="text-[var(--gold)]" />
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                    Produtos
                  </p>

                  <h2 className="text-sm sm:text-base uppercase tracking-[0.16em] text-white/90">
                    Itens do pedido
                  </h2>
                </div>
              </div>

              <div className="divide-y divide-white/10">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-5 first:pt-0 last:pb-0"
                  >
                    <div className="flex gap-4 sm:gap-5">
                      <div className="relative w-20 sm:w-24 md:w-28 shrink-0 aspect-[3/4] overflow-hidden rounded-2xl bg-black border border-white/10">
                        <Image
                          src={resolveImage(item.product?.image)}
                          alt={item.product?.name || "Produto"}
                          fill
                          sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 112px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base uppercase tracking-[0.12em] text-white/90 leading-relaxed">
                          {item.product?.name || "Produto"}
                        </h3>

                        <div className="mt-3 grid grid-cols-2 sm:flex sm:flex-wrap gap-x-6 gap-y-3 text-xs text-white/50">
                          <div>
                            <p className="text-[9px] uppercase tracking-[0.18em] text-white/30 mb-1">
                              Tamanho
                            </p>

                            <p className="text-white/70">
                              {item.variant?.size || item.size || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[9px] uppercase tracking-[0.18em] text-white/30 mb-1">
                              Quantidade
                            </p>

                            <p className="text-white/70">{item.quantity}</p>
                          </div>

                          <div>
                            <p className="text-[9px] uppercase tracking-[0.18em] text-white/30 mb-1">
                              Valor unitário
                            </p>

                            <p className="text-white/70">
                              {formatCurrency(item.price)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                            Subtotal
                          </span>

                          <span className="text-sm sm:text-base text-[var(--gold)] font-medium">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {order.address && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center">
                    <MapPin size={17} className="text-[var(--gold)]" />
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                      Entrega
                    </p>

                    <h2 className="text-sm sm:text-base uppercase tracking-[0.16em] text-white/90">
                      Endereço de entrega
                    </h2>
                  </div>
                </div>

                <div className="text-sm text-white/60 leading-relaxed">
                  <p className="text-white/85 font-medium">
                    {order.address.name}
                  </p>

                  <p className="mt-2">
                    {order.address.street}, {order.address.number}
                  </p>

                  {order.address.complement && (
                    <p>{order.address.complement}</p>
                  )}

                  <p>
                    {order.address.district} — {order.address.city}/
                    {order.address.state}
                  </p>

                  <p>CEP {order.address.zipCode}</p>
                </div>

                <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.18em] text-white/30">
                      Forma de envio
                    </p>

                    <p className="mt-1 text-sm text-white/75">
                      {order.shippingName || "Não informado"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase tracking-[0.18em] text-white/30">
                      Prazo
                    </p>

                    <p className="mt-1 text-sm text-white/75">
                      {order.shippingDeadline || "Não informado"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 lg:sticky lg:top-28">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center">
                  <ReceiptText size={17} className="text-[var(--gold)]" />
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                    Resumo
                  </p>

                  <h2 className="text-sm uppercase tracking-[0.16em] text-white/90">
                    Valores do pedido
                  </h2>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4 text-white/50">
                  <span>Subtotal</span>
                  <span className="text-white/75">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>

                {order.discount > 0 && (
                  <div className="flex items-center justify-between gap-4 text-white/50">
                    <span>
                      Desconto
                      {order.couponCode ? ` (${order.couponCode})` : ""}
                    </span>

                    <span className="text-emerald-300">
                      - {formatCurrency(order.discount)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 text-white/50">
                  <span>Frete</span>

                  <span className="text-white/75">
                    {order.shippingPrice > 0
                      ? formatCurrency(order.shippingPrice)
                      : "Grátis"}
                  </span>
                </div>

                <div className="pt-4 mt-4 border-t border-white/10 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                      Total pago
                    </p>
                  </div>

                  <p className="text-2xl text-[var(--gold)] font-medium">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard size={16} className="text-[var(--gold)]" />

                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                    Pagamento
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-white/45">Método</span>

                    <span className="text-white/80">
                      {getPaymentMethodLabel(order.payment)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-white/45">Status</span>

                    <span className="text-white/80">
                      {getPaymentStatusLabel(order.payment)}
                    </span>
                  </div>

                  {order.payment?.provider && (
                    <div className="flex justify-between gap-4">
                      <span className="text-white/45">Gateway</span>

                      <span className="text-white/80 capitalize">
                        {order.payment.provider}
                      </span>
                    </div>
                  )}

                  {order.payment?.method?.toLowerCase() === "card" &&
                    order.payment.cardLast4 && (
                      <div className="flex justify-between gap-4">
                        <span className="text-white/45">Cartão</span>

                        <span className="text-white/80">
                          •••• {order.payment.cardLast4}
                        </span>
                      </div>
                    )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-3 text-xs text-white/45">
                  <CheckCircle2
                    size={16}
                    className="text-emerald-300 shrink-0"
                  />

                  <span>
                    Pedido protegido e registrado com pagamento seguro.
                  </span>
                </div>
              </div>

              <Link
                href="/account/orders"
                className="
                  mt-6
                  w-full
                  inline-flex items-center justify-center gap-2
                  rounded-full
                  border border-white/15
                  px-5 py-3.5
                  text-[10px] uppercase tracking-[0.25em]
                  text-white/75
                  transition
                  hover:border-[var(--gold)]
                  hover:text-[var(--gold)]
                "
              >
                <ArrowLeft size={15} />
                Voltar aos pedidos
              </Link>
            </div>

            {order.shippingName && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <Truck
                    size={18}
                    className="text-[var(--gold)] shrink-0 mt-0.5"
                  />

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">
                      Transporte
                    </p>

                    <p className="mt-1 text-sm text-white/80">
                      {order.shippingName}
                    </p>

                    {order.shippingDeadline && (
                      <p className="mt-2 text-xs text-white/45 leading-relaxed">
                        Prazo informado: {order.shippingDeadline}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
