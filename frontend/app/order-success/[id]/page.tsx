"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    image: string;
  };
};

type Order = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

function resolveImage(url: string) {
  if (!url) return "/images/placeholder.png";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/images")) return url;
  return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
}

const statusMap: Record<string, string> = {
  PENDING: "Aguardando Pagamento",
  PAID: "Pagamento Aprovado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

export default function OrderSuccessPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    async function loadOrder() {
      try {
        const data = await apiFetch<Order>(`/orders/order/${orderId}`);

        setOrder({
          ...data,
          items: (data.items ?? []).map((item: OrderItem) => ({
            ...item,
            product: {
              ...item.product,
              image: resolveImage(item.product?.image),
            },
          })),
        });
      } catch (err) {
        console.error("Erro ao carregar pedido:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <section className="min-h-screen flex flex-col items-center justify-center pt-20 px-6">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white/60 text-xs tracking-widest uppercase">
          Localizando pedido...
        </p>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="min-h-screen flex flex-col items-center justify-center pt-20 px-6 text-center">
        <h1 className="text-2xl tracking-widest uppercase bs-title mb-4">
          Pedido não encontrado
        </h1>
        <p className="text-white/60 mb-8 max-w-md">
          Não conseguimos localizar as informações deste pedido. Se você acabou
          de comprar, aguarde alguns instantes e verifique seu e-mail.
        </p>
        <Link
          href="/catalog"
          className="px-8 py-3 rounded-full bg-[var(--gold)] text-black text-xs tracking-[0.35em] uppercase transition hover:scale-105"
        >
          Voltar à Loja
        </Link>
      </section>
    );
  }

  const statusLabel =
    statusMap[(order.status || "").toUpperCase()] ||
    order.status ||
    "Processando";

  return (
    <section className="max-w-3xl mx-auto px-6 md:px-8 pt-32 pb-32 min-h-screen">
      {/* HEADER DE SUCESSO */}
      <div className="flex flex-col items-start md:items-center text-left md:text-center mb-12">
        <CheckCircle className="text-[var(--gold)] w-16 h-16 mb-6 animate-pulse" />
        <p className="text-white/50 uppercase text-[10px] md:text-xs tracking-[0.4em] mb-4">
          Pedido nº {order.id.split("-")[0]}
        </p>

        <h1 className="text-3xl md:text-5xl tracking-widest uppercase bs-title mb-6">
          Pedido confirmado
        </h1>

        <p className="text-white/60 max-w-xl text-sm md:text-base leading-relaxed">
          Seu pedido foi criado com sucesso. Em breve você receberá as
          atualizações no seu e-mail de cadastro.
        </p>
      </div>

      {/* STATUS PILL */}
      <div className="mb-12 p-6 rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">
            Status atual
          </p>
          <p className="text-[var(--gold)] font-medium tracking-wide">
            {statusLabel}
          </p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">
            Data do Pedido
          </p>
          <p className="text-white/80 text-sm">
            {new Date(order.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      {/* ITENS */}
      <div className="space-y-6 bg-white/[0.02] border border-white/10 p-6 md:p-8 rounded-2xl">
        <h2 className="text-xs uppercase tracking-widest text-white/70 mb-6 border-b border-white/10 pb-4">
          Resumo dos Itens
        </h2>

        {(order.items ?? []).map((item: OrderItem) => (
          <div
            key={item.id}
            className="flex gap-4 md:gap-6 pb-6 border-b border-white/5 last:border-0 last:pb-0"
          >
            <div className="relative w-20 md:w-24 aspect-[3/4] overflow-hidden rounded-xl bg-black">
              <Image
                src={item.product?.image || "/images/placeholder.png"}
                alt={item.product?.name || "Produto"}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <h3 className="uppercase tracking-widest text-[10px] md:text-xs text-white/90">
                {item.product?.name || "Produto"}
              </h3>

              <p className="text-white/50 mt-1 text-[10px] uppercase tracking-widest">
                Qtd: {item.quantity}
              </p>

              <p className="text-[var(--gold)] mt-3 text-sm md:text-base font-medium">
                R$ {(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}

        {/* TOTAL */}
        <div className="border-t border-white/10 mt-4 pt-6 flex justify-between items-center text-lg">
          <span className="text-sm uppercase tracking-widest text-white/70">
            Total Pago
          </span>
          <span className="text-[var(--gold)] font-semibold text-xl">
            R$ {order.total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* CONFIANÇA */}
      <div className="mt-8 flex flex-wrap gap-4 text-[10px] uppercase tracking-widest text-white/40 justify-center md:justify-start">
        <p>✦ Pagamento seguro</p>
        <p>✦ Atualizações no e-mail</p>
        <p>✦ Compra garantida</p>
      </div>

      {/* AÇÕES (Mobile Friendly) */}
      <div className="mt-12 flex flex-col md:flex-row gap-4 md:justify-center">
        <Link
          href={`/account/orders`}
          className="
            w-full md:w-auto
            px-8 py-4 rounded-full 
            border border-white/20 bg-black
            text-center text-xs tracking-[0.35em] uppercase text-white/90
            hover:border-[var(--gold)] transition
          "
        >
          Meus pedidos
        </Link>

        <Link
          href="/catalog"
          className="
            w-full md:w-auto
            px-8 py-4 rounded-full
            bg-[var(--gold)] text-black
            text-center text-xs tracking-[0.35em] uppercase font-medium
            hover:scale-105 active:scale-[0.98] transition
          "
        >
          Continuar comprando
        </Link>
      </div>
    </section>
  );
}
