"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/store/auth";

import DashboardCards from "./components/DashboardCards";
import RevenueChart from "./components/RevenueChart";
import RecentOrdersPanel from "./components/RecentOrdersPanel";
import StockOverviewPanel from "./components/StockOverviewPanel";

import { DashboardStats } from "./types/types";

type DashboardOrder = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  customer?: {
    name: string;
    surname: string;
  } | null;
};

type DashboardProduct = {
  id: string;
  name: string;
  slug: string;
  stock: number;
  image: string;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([]);
  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const logout = useAuth((s) => s.logout);

  async function loadDashboard(): Promise<void> {
    setLoading(true);

    try {
      const [statsData, ordersData, productsData] = await Promise.all([
        apiFetch<DashboardStats>("/admin/dashboard"),
        apiFetch<DashboardOrder[]>("/admin/orders"),
        apiFetch<DashboardProduct[]>("/products"),
      ]);

      setStats(statsData);
      setRecentOrders(ordersData.slice(0, 5));
      setProducts(productsData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  if (loading || !stats) {
    return (
      <section className="space-y-10">
        <div className="space-y-3">
          <div className="h-4 w-40 rounded-full bg-white/5 animate-pulse" />
          <div className="h-10 w-72 rounded-full bg-white/5 animate-pulse" />
          <div className="h-4 w-[420px] max-w-full rounded-full bg-white/5 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-[132px] rounded-2xl border border-white/10 bg-white/[0.03] animate-pulse"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
          <div className="h-[380px] rounded-3xl border border-white/10 bg-white/[0.03] animate-pulse" />
          <div className="h-[380px] rounded-3xl border border-white/10 bg-white/[0.03] animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-14">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs tracking-[0.4em] uppercase text-white/40">
            Painel Blackstore
          </p>

          <h1 className="text-4xl md:text-5xl font-light mt-3 leading-tight">
            Olá
            <span className="text-[var(--gold)] ml-2">Saray</span>
          </h1>

          <p className="text-white/50 mt-3 text-sm md:text-base max-w-xl leading-relaxed">
            Bem-vinda ao centro de controle da sua loja. Acompanhe desempenho,
            pedidos e estoque com uma visão mais clara, elegante e estratégica.
          </p>
        </div>

        <button
          onClick={logout}
          className="
            w-full md:w-auto
            px-6 py-3
            rounded-full
            border border-white/20
            text-xs
            tracking-[0.3em]
            uppercase
            hover:border-[var(--gold)]
            hover:text-[var(--gold)]
            hover:bg-white/[0.03]
            transition
          "
        >
          Sair
        </button>
      </div>

      <DashboardCards stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-[1.55fr_1fr] gap-6">
        <RevenueChart />
        <StockOverviewPanel products={products} />
      </div>

      <RecentOrdersPanel orders={recentOrders} />
    </section>
  );
}
