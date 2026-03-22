"use client";

import Image from "next/image";
import { Order } from "../types/types";

type Props = {
  orders: Order[];
  onSelect: (order: Order) => void;
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "pending": return "Pendente";
    case "processing": return "Processando";
    case "paid": return "Pago";
    case "shipped": return "Enviado";
    case "delivered": return "Entregue";
    case "cancelled": return "Cancelado";
    default: return status;
  }
}

function statusBadge(status: string): string {
  const base = "px-3 py-1 text-[11px] rounded-full uppercase tracking-[0.22em] border";

  switch (status) {
    case "pending":
      return `${base} border-yellow-400/20 bg-yellow-400/10 text-yellow-300`;
    case "processing":
      return `${base} border-blue-400/20 bg-blue-400/10 text-blue-300`;
    case "paid":
      return `${base} border-green-400/20 bg-green-400/10 text-green-300`;
    case "shipped":
      return `${base} border-purple-400/20 bg-purple-400/10 text-purple-300`;
    case "delivered":
      return `${base} border-emerald-400/20 bg-emerald-400/10 text-emerald-300`;
    case "cancelled":
      return `${base} border-red-400/20 bg-red-400/10 text-red-300`;
    default:
      return `${base} border-white/10 bg-white/[0.04] text-white/75`;
  }
}

function paymentBadge(status?: string) {
  if (!status) return "text-white/30";

  switch (status) {
    case "paid":
      return "text-green-400";
    case "pending":
      return "text-yellow-400";
    case "failed":
      return "text-red-400";
    default:
      return "text-white/60";
  }
}

export default function OrderTable({ orders, onSelect }: Props) {

  return (

    <div className="bs-glass border border-white/10 rounded-[30px] overflow-hidden">

      {/* HEADER */}

      <div className="px-4 sm:px-6 py-5 sm:py-6 border-b border-white/10 flex flex-col sm:flex-row justify-between sm:items-center gap-3">

        <div>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-white/40">
            Operação
          </p>
          <h3 className="text-xl sm:text-2xl font-light mt-2">
            Pedidos
          </h3>
        </div>

        <span className="text-[10px] sm:text-xs text-white/40">
          Clique para abrir
        </span>

      </div>

      {/* EMPTY */}

      {orders.length === 0 && (
        <div className="py-16 text-center text-white/40">
          Nenhum pedido encontrado
        </div>
      )}

      {/* TABLE */}

      <div className="divide-y divide-white/5">

        {orders.map((order) => (

          <div
            key={order.id}
            onClick={() => onSelect(order)}
            className="
            px-4 sm:px-6 py-4 sm:py-5
            flex flex-col md:flex-row md:items-center md:justify-between
            gap-4
            cursor-pointer
            hover:bg-white/[0.04]
            hover:scale-[1.005]
            transition
            "
          >

            {/* ESQUERDA */}

            <div className="flex items-center gap-4 min-w-0">

              {/* IMAGE */}

              {order.items[0]?.product?.image ? (

                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}${order.items[0].product.image}`}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-white/10 shrink-0"
                />

              ) : (

                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 shrink-0">
                  —
                </div>

              )}

              {/* INFO */}

              <div className="min-w-0">

                <p className="font-mono text-sm text-white break-words">
                  #{order.id.slice(0, 8)}
                </p>

                <p className="text-sm text-white/80 mt-1 truncate">
                  {order.customer.name} {order.customer.surname}
                </p>

                <p className="text-xs text-white/40 mt-1">
                  {order.items.length} item{order.items.length > 1 ? "s" : ""}
                </p>

              </div>

            </div>

            {/* CENTRO */}

            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-8">

              {/* PAGAMENTO */}

              <div>
                <p className="text-xs text-white/40 uppercase">
                  Pagamento
                </p>
                <p className={`text-sm mt-1 ${paymentBadge(order.payment?.status)}`}>
                  {order.payment?.method || "—"}
                </p>
              </div>

              {/* STATUS */}

              <div>
                <p className="text-xs text-white/40 uppercase">
                  Status
                </p>
                <span className={statusBadge(order.status)}>
                  {getStatusLabel(order.status)}
                </span>
              </div>

            </div>

            {/* DIREITA */}

            <div className="text-left md:text-right">

              <p className="text-base sm:text-lg font-light text-white">
                {formatCurrency(order.total)}
              </p>

              <p className="text-xs text-white/40 mt-1">
                {new Date(order.createdAt).toLocaleDateString("pt-BR")}
              </p>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}