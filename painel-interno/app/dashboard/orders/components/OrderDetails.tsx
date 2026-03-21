"use client";

import { apiFetch } from "@/lib/api";
import { Order } from "../types/types";

type Props = {
  order: Order | null;
  onClose: () => void;
  onUpdated: () => Promise<void>;
};

const STATUS_OPTIONS = [
  "pending",
  "processing",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function statusBadge(status: string) {
  const base =
    "px-3 py-1 text-xs rounded-full uppercase tracking-wider";

  switch (status) {
    case "pending":
      return `${base} bg-yellow-400/10 text-yellow-400`;

    case "processing":
      return `${base} bg-blue-400/10 text-blue-400`;

    case "paid":
      return `${base} bg-green-400/10 text-green-400`;

    case "shipped":
      return `${base} bg-purple-400/10 text-purple-400`;

    case "delivered":
      return `${base} bg-emerald-400/10 text-emerald-400`;

    case "cancelled":
      return `${base} bg-red-400/10 text-red-400`;

    default:
      return `${base} bg-white/10 text-white`;
  }
}

export default function OrderDetails({
  order,
  onClose,
  onUpdated,
}: Props) {

  if (!order) return null;

  const currentOrder = order;

  async function handleStatusChange(status: string) {

    await apiFetch(`/admin/orders/${currentOrder.id}/status/${status}`, {
      method: "PATCH",
    });

    await onUpdated();
    onClose();

  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-6">

      <div
        className="
        w-full
        max-w-5xl
        max-h-[90vh]
        overflow-y-auto
        bs-glass
        border border-white/10
        bg-[#0b0b0d]
        p-10
        rounded-2xl
        shadow-[0_20px_80px_rgba(0,0,0,0.6)]
        "
      >

        {/* HEADER */}

        <div className="flex items-start justify-between mb-10">

          <div className="space-y-2">

            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Pedido
            </p>

            <h2 className="text-3xl font-light">
              #{order.id.slice(0, 8)}
            </h2>

            <p className="text-sm text-white/50">
              Criado em{" "}
              {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>

          </div>

          <button
            onClick={onClose}
            className="
            w-10
            h-10
            flex
            items-center
            justify-center
            rounded-full
            border border-white/10
            hover:border-[var(--gold)]
            hover:text-[var(--gold)]
            transition
            "
          >
            ✕
          </button>

        </div>

        {/* STATUS */}

        <div className="mb-10">
          <span className={statusBadge(order.status)}>
            {order.status}
          </span>
        </div>

        {/* CLIENTE + ENTREGA */}

        <div className="grid md:grid-cols-2 gap-8 mb-10">

          <div className="border border-white/10 rounded-xl p-6">

            <h3 className="text-lg mb-4">Cliente</h3>

            <p>
              {order.customer.name} {order.customer.surname}
            </p>

            <p className="text-white/70 mt-2">
              {order.customer.email}
            </p>

            <p className="text-white/70 mt-2">
              {order.customer.phone || "Sem telefone"}
            </p>

          </div>

          <div className="border border-white/10 rounded-xl p-6">

            <h3 className="text-lg mb-4">Entrega</h3>

            {order.address ? (
              <>
                <p>
                  {order.address.street}, {order.address.number}
                </p>

                {order.address.complement && (
                  <p className="mt-2">
                    {order.address.complement}
                  </p>
                )}

                <p className="mt-2">
                  {order.address.district} - {order.address.city}/
                  {order.address.state}
                </p>

                <p className="mt-2">
                  CEP {order.address.zipCode}
                </p>
              </>
            ) : (
              <p className="text-white/60">
                Endereço não informado
              </p>
            )}

          </div>

        </div>

        {/* PAGAMENTO + FRETE */}

        <div className="grid md:grid-cols-2 gap-8 mb-10">

          <div className="border border-white/10 rounded-xl p-6">

            <h3 className="text-lg mb-4">Pagamento</h3>

            {order.payment ? (
              <>
                <p>Método: {order.payment.method}</p>

                <p className="mt-2">
                  Status: {order.payment.status}
                </p>

                <p className="mt-2">
                  Valor: {formatCurrency(order.payment.amount)}
                </p>
              </>
            ) : (
              <p className="text-white/60">
                Pagamento não iniciado
              </p>
            )}

          </div>

          <div className="border border-white/10 rounded-xl p-6">

            <h3 className="text-lg mb-4">Frete</h3>

            <p>Nome: {order.shippingName || "-"}</p>

            <p className="mt-2">
              Método: {order.shippingMethod || "-"}
            </p>

            <p className="mt-2">
              Prazo: {order.shippingDeadline || "-"}
            </p>

            <p className="mt-2">
              Valor: {formatCurrency(order.shippingPrice)}
            </p>

          </div>

        </div>

        {/* ITENS */}

        <div className="border border-white/10 rounded-xl p-6 mb-10">

          <h3 className="text-lg mb-6">Itens do pedido</h3>

          <div className="space-y-5">

            {order.items.map((item) => (

              <div
                key={item.id}
                className="
                flex
                items-center
                justify-between
                border-b border-white/10
                pb-4
                "
              >

                <div className="flex items-center gap-4">

                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${item.product.image}`}
                    alt={item.product.name}
                    className="w-14 h-14 rounded object-cover"
                  />

                  <div>

                    <p>{item.product.name}</p>

                    <p className="text-sm text-white/50 mt-1">
                      Quantidade: {item.quantity}
                    </p>

                  </div>

                </div>

                <div className="text-right">

                  <p>
                    {formatCurrency(item.price)}
                  </p>

                  <p className="text-sm text-white/50 mt-1">
                    Total: {formatCurrency(item.price * item.quantity)}
                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

        {/* RESUMO */}

        <div className="border border-white/10 rounded-xl p-6 mb-10">

          <h3 className="text-lg mb-4">
            Resumo financeiro
          </h3>

          <div className="space-y-3">

            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span>Frete</span>
              <span>{formatCurrency(order.shippingPrice)}</span>
            </div>

            <div className="flex justify-between text-lg pt-4 border-t border-white/10">

              <span>Total</span>

              <span className="text-[var(--gold)] font-semibold">
                {formatCurrency(order.total)}
              </span>

            </div>

          </div>

        </div>

        {/* STATUS ACTION */}

        <div className="border border-white/10 rounded-xl p-6">

          <h3 className="text-lg mb-4">
            Atualizar status
          </h3>

          <div className="flex flex-wrap gap-3">

            {STATUS_OPTIONS.map((status) => (

              <button
                key={status}
                onClick={() => void handleStatusChange(status)}
                className={`px-4 py-2 border rounded-full text-sm transition ${
                  order.status === status
                    ? "border-[var(--gold)] text-[var(--gold)]"
                    : "border-white/20 hover:border-white"
                }`}
              >
                {status}
              </button>

            ))}

          </div>

        </div>

      </div>
    </div>
  );
}