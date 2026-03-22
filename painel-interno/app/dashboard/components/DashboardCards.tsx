"use client";

import { useRouter } from "next/navigation";
import CountUp from "react-countup";

import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Layers,
} from "lucide-react";

import { DashboardStats } from "../types/types";

type Card = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: typeof DollarSign;
  route: string;
  trend?: number;
};

export default function DashboardCards({ stats }: { stats: DashboardStats }) {
  const router = useRouter();

  const cards: Card[] = [
    {
      label: "Receita",
      value: stats.revenue,
      prefix: "R$ ",
      icon: DollarSign,
      route: "/dashboard",
      trend: stats.growth,
    },

    {
      label: "Pedidos",
      value: stats.orders,
      icon: ShoppingCart,
      route: "/dashboard/orders",
    },

    {
      label: "Produtos",
      value: stats.products,
      icon: Package,
      route: "/dashboard/products",
    },

    {
      label: "Categorias",
      value: stats.categories,
      icon: Layers,
      route: "/dashboard/categories",
    },

    {
      label: "Crescimento",
      value: stats.growth,
      suffix: "%",
      icon: TrendingUp,
      route: "/dashboard",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <button
            key={card.label}
            onClick={() => router.push(card.route)}
            className="
            relative
            group
            text-left
            bs-glass
            border border-white/10
            rounded-2xl
            p-6
            overflow-hidden
            transition
            hover:border-[var(--gold)]
            hover:shadow-[0_0_40px_rgba(212,175,55,0.15)]
            hover:scale-[1.02]
            "
          >
            {/* glow background */}

            <div
              className="
              absolute
              inset-0
              opacity-0
              group-hover:opacity-100
              transition
              bg-[radial-gradient(circle_at_80%_20%,rgba(212,175,55,0.12),transparent_60%)]
              "
            />

            {/* content */}

            <div className="relative flex items-start justify-between mb-5">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                {card.label}
              </p>

              <div
                className="
                w-9
                h-9
                rounded-xl
                flex
                items-center
                justify-center
                bg-white/5
                border border-white/10
                text-[var(--gold)]
                "
              >
                <Icon size={16} />
              </div>
            </div>

            <div className="relative flex items-end gap-3">
              <p className="text-3xl font-light">
                {card.prefix}

                <CountUp end={card.value} duration={1.6} separator="." />

                {card.suffix}
              </p>

              {card.trend && (
                <span
                  className="
                  text-xs
                  text-emerald-400
                  mb-1
                  flex
                  items-center
                  gap-1
                  "
                >
                  ↑ {card.trend}%
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
