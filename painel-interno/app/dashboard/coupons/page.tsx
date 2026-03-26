"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import CouponForm from "./components/CouponForm";
import CouponTable from "./components/CouponTable";
import { Coupon } from "./types/types";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadCoupons() {
    try {
      setLoading(true);

      const data = await apiFetch<Coupon[]>("/admin/coupons");

      setCoupons(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      await loadCoupons();
    }

    void init();
  }, []);

  async function handleSave(data: {
    code: string;
    discount: number;
    maxUses: number;
    expiresAt: string;
    isFeatured: boolean;
    active: boolean;
  }) {
    if (editing) {
      await apiFetch(`/admin/coupons/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    } else {
      await apiFetch("/admin/coupons", {
        method: "POST",
        body: JSON.stringify(data),
      });
    }

    setEditing(null);
    await loadCoupons();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir cupom?")) return;

    await apiFetch(`/admin/coupons/${id}`, {
      method: "DELETE",
    });

    if (editing?.id === id) {
      setEditing(null);
    }

    await loadCoupons();
  }

  const activeCoupons = coupons.filter((coupon) => coupon.active).length;
  const featuredCoupons = coupons.filter((coupon) => coupon.isFeatured).length;
  const expiredCoupons = coupons.filter(
    (coupon) => new Date(coupon.expiresAt) < new Date(),
  ).length;

  return (
    <section className="space-y-8 md:space-y-10">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-6 sm:p-8 md:p-10">
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.14),transparent_32%),radial-gradient(circle_at_left_center,rgba(228,163,181,0.10),transparent_28%)]
          "
        />

        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/40">
              Blackstore Admin
            </p>

            <h1 className="mt-4 text-3xl font-light leading-tight sm:text-4xl md:text-5xl">
              Gestão de
              <span className="bs-title ml-3">Cupons</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
              Controle campanhas promocionais, descontos estratégicos, cupons em
              destaque e disponibilidade.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[520px]">
            <div className="bs-glass rounded-2xl border border-white/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">
                Total
              </p>
              <p className="mt-3 text-2xl font-light text-white">
                {coupons.length}
              </p>
            </div>

            <div className="bs-glass rounded-2xl border border-white/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">
                Ativos
              </p>
              <p className="mt-3 text-2xl font-light text-[var(--gold)]">
                {activeCoupons}
              </p>
            </div>

            <div className="bs-glass rounded-2xl border border-white/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">
                Destaque / Expirados
              </p>
              <p className="mt-3 text-2xl font-light text-white">
                {featuredCoupons}
                <span className="mx-2 text-white/25">/</span>
                <span className="text-rose-300">{expiredCoupons}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <CouponForm
        editing={editing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-light text-white sm:text-2xl">
              Lista de cupons
            </h2>
            <p className="mt-1 text-sm text-white/45">
              Visualize, edite e mantenha o controle operacional dos descontos
              ativos da Blackstore.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] uppercase tracking-[0.28em] text-white/45">
              {coupons.length} registros
            </span>

            {editing && (
              <span className="rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.28em] text-[var(--gold)]">
                Editando {editing.code}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : (
          <CouponTable
            coupons={coupons}
            onEdit={setEditing}
            onDelete={handleDelete}
          />
        )}
      </div>
    </section>
  );
}
