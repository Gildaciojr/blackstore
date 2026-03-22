"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Download,
  Search,
  ShoppingBag,
  Wallet,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import OrderTable from "./components/OrderTable";
import OrderDetails from "./components/OrderDetails";
import { Order } from "./types/types";

type StatusFilter =
  | "all"
  | "pending"
  | "processing"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

type QuickFilter = "all" | "today" | "pending";

const PAGE_SIZE = 8;

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  async function loadOrders(): Promise<void> {
    setLoading(true);

    try {
      const data = await apiFetch<Order[]>("/admin/orders");
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  const metrics = useMemo(() => {
    const todayOrders = orders.filter((order) => isToday(order.createdAt));

    const pending = orders.filter((order) => order.status === "pending").length;

    const todayRevenue = todayOrders.reduce((acc, order) => acc + order.total, 0);

    return {
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      todayRevenue,
      pending,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (quickFilter === "today") {
      result = result.filter((order) => isToday(order.createdAt));
    }

    if (quickFilter === "pending") {
      result = result.filter((order) => order.status === "pending");
    }

    if (statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter);
    }

    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return result;
    }

    return result.filter((order) => {
      const fullName =
        `${order.customer.name} ${order.customer.surname}`.toLowerCase();

      return (
        fullName.includes(normalizedSearch) ||
        order.customer.email.toLowerCase().includes(normalizedSearch) ||
        order.id.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [orders, quickFilter, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, quickFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, page]);

  function exportOrdersCsv(): void {
    const headers = ["pedido", "cliente", "email", "status", "total", "data"];

    const rows = filteredOrders.map((order) => [
      order.id,
      `${order.customer.name} ${order.customer.surname}`,
      order.customer.email,
      order.status,
      order.total.toFixed(2),
      new Date(order.createdAt).toLocaleDateString("pt-BR"),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", "pedidos-blackstore.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleQuickFilter(filter: QuickFilter): void {
    setQuickFilter(filter);

    if (filter === "pending") {
      setStatusFilter("pending");
      return;
    }

    if (filter === "all" && statusFilter === "pending") {
      setStatusFilter("all");
    }
  }

  const metricCards = [
    {
      id: "all" as QuickFilter,
      title: "Pedidos",
      value: metrics.totalOrders.toString(),
      subtitle: "Todos os pedidos da operação",
      icon: ShoppingBag,
      highlight: false,
    },
    {
      id: "today" as QuickFilter,
      title: "Hoje",
      value: metrics.todayOrders.toString(),
      subtitle: "Pedidos realizados na data atual",
      icon: CalendarDays,
      highlight: false,
    },
    {
      id: "today-revenue" as const,
      title: "Receita Hoje",
      value: formatCurrency(metrics.todayRevenue),
      subtitle: "Faturamento dos pedidos do dia",
      icon: Wallet,
      highlight: true,
    },
    {
      id: "pending" as QuickFilter,
      title: "Pendentes",
      value: metrics.pending.toString(),
      subtitle: "Pedidos aguardando andamento",
      icon: Clock3,
      highlight: false,
    },
  ];

  return (
    <section className="space-y-10 px-4 sm:px-6 lg:px-0">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-[24px] sm:rounded-[30px] border border-white/10 bg-[rgba(0,0,0,0.28)] p-5 sm:p-8 lg:p-10 backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(228,163,181,0.10),transparent_28%),radial-gradient(circle_at_right_center,rgba(212,175,55,0.12),transparent_30%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">

          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-white/40">
              Gestão
            </p>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-light mt-2 leading-tight break-words">
              Pedidos da <span className="bs-title">Loja</span>
            </h1>

            <p className="text-white/50 mt-3 max-w-xl leading-relaxed text-sm sm:text-base">
              Visualize, filtre, acompanhe e gerencie todos os pedidos realizados
              na Blackstore com uma visão estratégica da operação.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">

            {/* SEARCH */}
            <div className="relative w-full md:w-80">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
              />

              <input
                placeholder="Buscar pedido ou cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="
                  w-full
                  bg-white/5
                  border border-white/10
                  rounded-xl
                  pl-11 pr-4 py-3
                  outline-none
                  focus:border-[var(--gold)]
                  transition
                "
              />
            </div>

            {/* EXPORT */}
            <button
              onClick={exportOrdersCsv}
              className="
                inline-flex items-center justify-center gap-2
                px-5 py-3
                rounded-xl
                border border-white/15
                bg-white/[0.03]
                text-xs uppercase tracking-[0.28em]
                hover:border-[var(--gold)]
                hover:text-[var(--gold)]
                hover:bg-white/[0.05]
                transition
              "
            >
              <Download size={14} />
              Exportar CSV
            </button>

          </div>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {metricCards.map((card) => {
          const Icon = card.icon;

          const isActive =
            (card.id === "all" && quickFilter === "all") ||
            (card.id === "today" && quickFilter === "today") ||
            (card.id === "pending" && quickFilter === "pending");

          const onClick =
            card.id === "today-revenue"
              ? () => handleQuickFilter("today")
              : () => handleQuickFilter(card.id);

          return (
            <button
              key={card.title}
              onClick={onClick}
              className={`
                relative overflow-hidden text-left
                rounded-[24px] sm:rounded-[26px] border p-5 sm:p-6 transition duration-300
                ${
                  isActive
                    ? "border-[var(--gold)] bg-[rgba(212,175,55,0.06)] shadow-[0_0_35px_rgba(212,175,55,0.12)]"
                    : "border-white/10 bg-[rgba(255,255,255,0.03)] hover:border-[var(--gold)] hover:shadow-[0_0_25px_rgba(212,175,55,0.12)] hover:scale-[1.015]"
                }
              `}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.10),transparent_38%),radial-gradient(circle_at_left_center,rgba(228,163,181,0.08),transparent_32%)] pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/45">
                      {card.title}
                    </p>

                    <p className={`mt-4 text-3xl font-light ${card.highlight ? "text-[var(--gold)]" : "text-white"}`}>
                      {card.value}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[var(--gold)]">
                    <Icon size={18} />
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-white/45">
                  {card.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {[
          ["all", "Todos"],
          ["pending", "Pendentes"],
          ["processing", "Processando"],
          ["paid", "Pagos"],
          ["shipped", "Enviados"],
          ["delivered", "Entregues"],
          ["cancelled", "Cancelados"],
        ].map(([value, label]) => {
          const active = statusFilter === value;

          return (
            <button
              key={value}
              onClick={() => setStatusFilter(value as StatusFilter)}
              className={`
                px-3 sm:px-4 py-2 rounded-full border text-xs sm:text-sm transition
                ${
                  active
                    ? "border-[var(--gold)] text-[var(--gold)] bg-[rgba(212,175,55,0.06)]"
                    : "border-white/20 hover:border-white/40 hover:bg-white/[0.03]"
                }
              `}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* TABELA */}
      {loading ? (
        <div className="bs-glass border border-white/10 rounded-2xl p-10 text-white/50">
          Carregando pedidos...
        </div>
      ) : (
        <>
          <OrderTable orders={paginatedOrders} onSelect={setSelectedOrder} />

          {/* PAGINAÇÃO */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-white/45">
              Exibindo {paginatedOrders.length} de {filteredOrders.length} pedido
              {filteredOrders.length !== 1 ? "s" : ""}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="
                  px-4 py-2 rounded-full border border-white/15 text-sm
                  disabled:opacity-40 disabled:cursor-not-allowed
                  hover:border-[var(--gold)] hover:text-[var(--gold)]
                  transition
                "
              >
                Anterior
              </button>

              <span className="text-sm text-white/60">
                Página {page} de {totalPages}
              </span>

              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="
                  px-4 py-2 rounded-full border border-white/15 text-sm
                  disabled:opacity-40 disabled:cursor-not-allowed
                  hover:border-[var(--gold)] hover:text-[var(--gold)]
                  transition
                "
              >
                Próxima
              </button>
            </div>
          </div>
        </>
      )}

      <OrderDetails
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdated={loadOrders}
      />
    </section>
  );
}