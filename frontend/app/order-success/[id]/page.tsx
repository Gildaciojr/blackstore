"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

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

type Props = {
  params: {
    id: string;
  };
};

function resolveImage(url: string) {
  if (!url) return "/images/placeholder.png";

  if (url.startsWith("http")) return url;
  if (url.startsWith("/images")) return url;

  return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
}

export default function OrderSuccessPage({ params }: Props) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!params?.id) return;

    async function loadOrder() {
      try {
        const data = await apiFetch<Order>(`/orders/order/${params.id}`);

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
      }
    }

    loadOrder();
  }, [params.id]);

  if (!order) {
    return (
      <section className="pt-40 pb-32 text-center">
        <p className="text-white/60">Carregando pedido...</p>
      </section>
    );
  }

  const statusLabel = order?.status ?? "Processando";

  return (
    <section className="max-w-5xl mx-auto px-6 md:px-8 pt-32 pb-32">
      <p className="text-white/50 uppercase text-xs tracking-[0.4em] mb-4">
        Pedido realizado com sucesso
      </p>

      <h1 className="text-3xl md:text-5xl tracking-widest uppercase bs-title mb-6">
        Pedido confirmado
      </h1>

      <p className="text-white/60 mb-10 max-w-xl">
        Seu pedido foi criado com sucesso. Você poderá acompanhar o status de
        envio a qualquer momento.
      </p>

      {/* STATUS */}
      <div className="mb-12 p-5 rounded-xl border border-[var(--gold)]/40 bg-white/[0.02]">
        <p className="text-xs uppercase tracking-widest text-white/50 mb-2">
          Status atual
        </p>
        <p className="text-[var(--gold)] text-sm">{statusLabel}</p>
      </div>

      {/* ITENS */}
      <div className="space-y-8">
        {(order.items ?? []).map((item: OrderItem) => (
          <div
            key={item.id}
            className="flex gap-6 md:gap-8 pb-6 border-b border-white/10"
          >
            <div className="relative w-24 md:w-28 aspect-[3/4] overflow-hidden rounded-lg">
              <Image
                src={item.product?.image || "/images/placeholder.png"}
                alt={item.product?.name || "Produto"}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1">
              <h3 className="uppercase tracking-widest text-xs md:text-sm">
                {item.product?.name || "Produto"}
              </h3>

              <p className="text-white/60 mt-2 text-sm">
                Quantidade: {item.quantity}
              </p>

              <p className="text-[var(--gold)] mt-2 text-lg">
                R$ {(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* TOTAL */}
      <div className="border-t border-white/10 mt-10 pt-6 flex justify-between text-lg">
        <span>Total</span>
        <span className="text-[var(--gold)] font-semibold">
          R$ {order.total.toFixed(2)}
        </span>
      </div>

      {/* CONFIANÇA */}
      <div className="mt-8 text-[10px] uppercase tracking-widest text-white/60 space-y-1">
        <p>✦ Pagamento seguro</p>
        <p>✦ Atualizações por status</p>
        <p>✦ Entrega garantida</p>
      </div>

      {/* AÇÕES */}
      <div className="mt-14 flex flex-col sm:flex-row gap-4">
        <Link
          href={`/account/orders/${order.id}`}
          className="
            px-8 py-4 rounded-full 
            border border-white/20 
            text-xs tracking-[0.35em] uppercase
            hover:border-[var(--gold)] transition
          "
        >
          Acompanhar pedido
        </Link>

        <Link
          href="/catalog"
          className="
            px-8 py-4 rounded-full
            bg-[var(--gold)] text-black
            text-xs tracking-[0.35em] uppercase
            hover:scale-105 transition
          "
        >
          Continuar comprando
        </Link>
      </div>
    </section>
  );
}
