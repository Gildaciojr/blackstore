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

export default function OrderSuccessPage({ params }: Props) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function loadOrder() {
      const data = await apiFetch<Order>(`/orders/order/${params.id}`);

      setOrder({
        ...data,
        items: data.items.map((item) => ({
          ...item,
          product: {
            ...item.product,
            image: `${process.env.NEXT_PUBLIC_API_URL}${item.product.image}`,
          },
        })),
      });
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

  return (
    <section className="max-w-5xl mx-auto px-8 pt-40 pb-32">
      <h1 className="text-4xl md:text-5xl tracking-widest uppercase bs-title mb-16">
        Pedido confirmado
      </h1>

      <p className="text-white/60 mb-14">
        Seu pedido foi criado com sucesso. Em breve você receberá mais
        informações sobre pagamento e envio.
      </p>

      <div className="space-y-10">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex gap-8 pb-8 border-b border-white/10"
          >
            <div className="relative w-28 aspect-3/4 overflow-hidden">
              <Image
                src={item.product.image}
                alt={item.product.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1">
              <h3 className="uppercase tracking-widest text-sm">
                {item.product.name}
              </h3>

              <p className="text-white/60 mt-2">Quantidade: {item.quantity}</p>

              <p className="text-[var(--gold)] mt-2">
                R$ {(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 mt-14 pt-10 flex justify-between text-lg">
        <span>Total</span>

        <span className="text-[var(--gold)]">R$ {order.total.toFixed(2)}</span>
      </div>

      <div className="mt-16 flex gap-6">
        <Link
          href="/"
          className="
            px-10 py-4 rounded-full
            border border-white/20
            text-xs tracking-[0.35em] uppercase
            hover:border-white transition
          "
        >
          Voltar à loja
        </Link>

        <Link
          href="/catalog"
          className="
            px-10 py-4 rounded-full
            bg-[var(--gold)] text-black
            text-xs tracking-[0.35em] uppercase font-medium
            hover:scale-105 transition
          "
        >
          Continuar comprando
        </Link>
      </div>
    </section>
  );
}
