"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

type Order = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
};

function getCustomerId() {
  return localStorage.getItem("bs_customer");
}

export default function OrdersPage() {

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {

    async function loadOrders() {

      const customerId = getCustomerId();

      if (!customerId) return;

      const data = await apiFetch<Order[]>(`/customer/${customerId}/orders`);

      setOrders(data);

    }

    loadOrders();

  }, []);

  return (
    <section className="max-w-6xl mx-auto px-8 pt-40 pb-32">

      <h1 className="text-4xl md:text-5xl tracking-widest uppercase bs-title mb-16">
        Meus Pedidos
      </h1>

      {orders.length === 0 && (
        <p className="text-white/60">Nenhum pedido encontrado.</p>
      )}

      <div className="space-y-8">

        {orders.map((order) => (

          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="block border border-white/10 p-8 hover:border-[var(--gold)] transition"
          >

            <div className="flex justify-between">

              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                  Pedido
                </p>

                <p className="text-white mt-2">
                  #{order.id.slice(0,8)}
                </p>
              </div>

              <div className="text-right">

                <p className="text-white/60 text-sm">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>

                <p className="text-[var(--gold)] mt-2">
                  R$ {order.total.toFixed(2)}
                </p>

              </div>

            </div>

          </Link>

        ))}

      </div>

    </section>
  );
}