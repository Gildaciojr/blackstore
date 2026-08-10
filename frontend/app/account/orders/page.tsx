"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CreditCard,
  Package,
  PackageCheck,
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

type Payment = {
  id: string;
  method: string;
  status: string;
  provider?: string | null;
};

type Order = {
  id: string;
  subtotal: number;
  shippingPrice: number;
  discount: number;
  total: number;
  status: string;
  shippingName?: string | null;
  shippingMethod?: string | null;
  shippingDeadline?: string | null;
  createdAt: string;
  items: OrderItem[];
  payment?: Payment | null;
};

function getCustomerId() {
  return localStorage.getItem("bs_customer");
}

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

  if (normalized === "paid") {
    return "Pagamento aprovado";
  }

  if (normalized === "pending") {
    return "Aguardando pagamento";
  }

  if (normalized === "shipped") {
    return "Pedido enviado";
  }

  if (normalized === "delivered") {
    return "Entregue";
  }

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

function getPaymentLabel(payment?: Payment | null) {
  if (!payment?.method) {
    return "Pagamento não informado";
  }

  const method = payment.method.toLowerCase();

  if (method === "pix") {
    return "PIX";
  }

  if (method === "card") {
    return "Cartão";
  }

  return payment.method;
}

function getTotalItems(items: OrderItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        setError(null);

        const customerId = getCustomerId();

        if (!customerId) {
          setOrders([]);
          setError("Não foi possível identificar sua conta.");
          return;
        }

        const data = await apiFetch<Order[]>(`/orders/${customerId}`);

        setOrders(data);
      } catch (err) {
        console.error("Erro ao carregar pedidos:", err);
        setError("Não foi possível carregar seus pedidos.");
      } finally {
        setLoading(false);
      }
    }

    void loadOrders();
  }, []);

  const totalOrders = orders.length;

  const totalPaid = useMemo(() => {
    return orders
      .filter((order) => order.status.toLowerCase() === "paid")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
  }, [orders]);

  if (loading) {
    return (
      <section className="min-h-screen px-4 sm:px-6 md:px-8 pt-28 sm:pt-32 md:pt-40 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[45vh]">
            <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin mb-4" />

            <p className="text-white/50 text-[10px] sm:text-xs uppercase tracking-[0.3em]">
              Carregando seus pedidos...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen px-4 sm:px-6 md:px-8 pt-28 sm:pt-32 md:pt-40 pb-24 md:pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10 md:mb-14">
          <div>
            <p className="text-[var(--gold)] text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-3">
              Minha conta
            </p>

            <h1 className="text-3xl sm:text-4xl md:text-5xl tracking-widest uppercase bs-title">
              Meus Pedidos
            </h1>

            <p className="mt-4 text-sm md:text-base text-white/50 max-w-2xl leading-relaxed">
              Acompanhe seus pedidos, pagamentos e informações de entrega em um
              só lugar.
            </p>
          </div>

          {totalOrders > 0 && (
            <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 min-w-0 lg:min-w-[150px]">
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                  Pedidos
                </p>

                <p className="mt-2 text-xl font-medium text-white">
                  {totalOrders}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 min-w-0 lg:min-w-[170px]">
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                  Total aprovado
                </p>

                <p className="mt-2 text-base sm:text-lg font-medium text-[var(--gold)] truncate">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-400/20 bg-red-400/5 px-5 py-4">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {!error && orders.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-14 sm:px-8 sm:py-16 text-center">
            <Package className="w-10 h-10 text-white/20 mx-auto mb-5" />

            <h2 className="text-lg sm:text-xl uppercase tracking-widest text-white">
              Nenhum pedido encontrado
            </h2>

            <p className="mt-3 text-sm text-white/50 max-w-md mx-auto leading-relaxed">
              Quando você realizar uma compra, os detalhes e atualizações do
              pedido aparecerão aqui.
            </p>

            <Link
              href="/catalog"
              className="
                inline-flex items-center justify-center gap-2
                mt-7 px-7 py-3.5 rounded-full
                bg-[var(--gold)] text-black
                text-[10px] sm:text-xs uppercase tracking-[0.3em] font-medium
                transition hover:scale-[1.02] active:scale-[0.98]
              "
            >
              Ver catálogo
            </Link>
          </div>
        )}

        <div className="space-y-5 md:space-y-6">
          {orders.map((order) => {
            const firstItem = order.items?.[0];
            const totalItems = getTotalItems(order.items ?? []);
            const additionalItems = Math.max((order.items?.length ?? 0) - 1, 0);

            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="
                  group block
                  rounded-3xl
                  border border-white/10
                  bg-white/[0.02]
                  overflow-hidden
                  transition-all duration-300
                  hover:border-[var(--gold)]/50
                  hover:bg-white/[0.035]
                "
              >
                <div className="p-4 sm:p-5 md:p-6 lg:p-7">
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5 mb-3">
                          <span
                            className={`
                              inline-flex items-center
                              rounded-full border
                              px-3 py-1.5
                              text-[9px] sm:text-[10px]
                              uppercase tracking-[0.18em]
                              ${getStatusClasses(order.status)}
                            `}
                          >
                            {getStatusLabel(order.status)}
                          </span>

                          <span className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                            #{order.id.slice(0, 8)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-white/45">
                          <CalendarDays size={14} />

                          <span className="text-xs sm:text-sm">
                            Pedido realizado em {formatDate(order.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                          Total
                        </p>

                        <p className="mt-1 text-xl sm:text-2xl text-[var(--gold)] font-medium">
                          {formatCurrency(order.total)}
                        </p>
                      </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    <div className="flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_220px] gap-5 md:gap-7">
                      <div className="flex min-w-0 gap-4 sm:gap-5">
                        <div className="relative w-20 sm:w-24 md:w-28 shrink-0 aspect-[3/4] overflow-hidden rounded-2xl bg-black border border-white/10">
                          <Image
                            src={resolveImage(firstItem?.product?.image)}
                            alt={firstItem?.product?.name || "Produto do pedido"}
                            fill
                            sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 112px"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        </div>

                        <div className="min-w-0 flex-1 py-1">
                          <p className="text-[10px] uppercase tracking-[0.25em] text-white/35 mb-2">
                            Resumo do pedido
                          </p>

                          <h2 className="text-sm sm:text-base uppercase tracking-[0.12em] text-white/90 line-clamp-2">
                            {firstItem?.product?.name || "Produto"}
                          </h2>

                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/50">
                            <span>
                              {totalItems} {totalItems === 1 ? "item" : "itens"}
                            </span>

                            {(firstItem?.variant?.size || firstItem?.size) && (
                              <span>
                                Tamanho: {firstItem.variant?.size || firstItem.size}
                              </span>
                            )}

                            {additionalItems > 0 && (
                              <span className="text-white/70">
                                + {additionalItems}{" "}
                                {additionalItems === 1 ? "produto" : "produtos"}
                              </span>
                            )}
                          </div>

                          <div className="mt-4 flex flex-wrap gap-3">
                            <div className="inline-flex items-center gap-2 text-xs text-white/45">
                              <CreditCard size={14} />

                              <span>{getPaymentLabel(order.payment)}</span>
                            </div>

                            {order.shippingName && (
                              <div className="inline-flex items-center gap-2 text-xs text-white/45">
                                <Truck size={14} />

                                <span>{order.shippingName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center shrink-0">
                            <PackageCheck
                              size={17}
                              className="text-[var(--gold)]"
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                              Entrega
                            </p>

                            <p className="mt-1 text-xs sm:text-sm text-white/75 truncate">
                              {order.shippingName || "A definir"}
                            </p>
                          </div>
                        </div>

                        {order.shippingDeadline && (
                          <p className="mt-3 text-xs text-white/45 leading-relaxed">
                            Prazo informado: {order.shippingDeadline}
                          </p>
                        )}

                        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                            Ver detalhes
                          </span>

                          <ArrowRight
                            size={17}
                            className="text-[var(--gold)] transition-transform duration-300 group-hover:translate-x-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
