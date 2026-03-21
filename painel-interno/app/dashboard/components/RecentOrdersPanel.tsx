"use client";

type OrderItem = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  customer?: {
    name: string;
    surname: string;
  } | null;
};

type Props = {
  orders: OrderItem[];
};

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2)}`;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getStatusLabel(status: string): string {
  const normalized = status.toLowerCase();

  if (normalized === "paid") return "Pago";
  if (normalized === "pending") return "Pendente";
  if (normalized === "processing") return "Em preparo";
  if (normalized === "shipped") return "Enviado";
  if (normalized === "delivered") return "Entregue";
  if (normalized === "cancelled" || normalized === "canceled") return "Cancelado";

  return status;
}

function getStatusClasses(status: string): string {
  const normalized = status.toLowerCase();

  if (normalized === "paid" || normalized === "delivered") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (normalized === "pending" || normalized === "processing") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  return "border-white/10 bg-white/[0.05] text-white/70";
}

export default function RecentOrdersPanel({ orders }: Props) {
  return (
    <div className="bs-glass border border-white/10 rounded-[28px] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.30)]">
      <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Pedidos
          </p>

          <h3 className="text-2xl font-light mt-2">
            Pedidos <span className="bs-title">recentes</span>
          </h3>
        </div>

        <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/55">
          Últimos 5 registros
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="px-6 py-10 text-center text-white/45">
          Nenhum pedido encontrado no momento.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.28em] text-white/45">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.28em] text-white/45">
                  Data
                </th>
                <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.28em] text-white/45">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.28em] text-white/45">
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => {
                const customerName = order.customer
                  ? `${order.customer.name} ${order.customer.surname}`.trim()
                  : "Cliente";

                return (
                  <tr
                    key={order.id}
                    className="border-b border-white/8 transition hover:bg-white/[0.03]"
                  >
                    <td className="px-6 py-5 text-white/90">{customerName}</td>
                    <td className="px-6 py-5 text-white/60">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] ${getStatusClasses(order.status)}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-white">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}