"use client";

import { useMemo, useState } from "react";
import { Coupon } from "../types/types";
import ConfirmModal from "@/components/ui/ConfirmModal";

type Props = {
  coupons: Coupon[];
  onEdit: (coupon: Coupon) => void;
  onDelete: (id: string) => void;
};

type Filter = "all" | "active" | "inactive" | "expired" | "featured";

export default function CouponTable({
  coupons,
  onEdit,
  onDelete,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function isExpired(date: string) {
    return new Date(date) < new Date();
  }

  // ===== FILTRO (SEM ALTERAR BACKEND) =====
  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      const expired = isExpired(coupon.expiresAt);

      if (filter === "active") return coupon.active && !expired;
      if (filter === "inactive") return !coupon.active;
      if (filter === "expired") return expired;
      if (filter === "featured") return coupon.isFeatured;

      return true;
    });
  }, [coupons, filter]);

  function handleDeleteClick(id: string) {
    setDeletingId(id);
  }

  function confirmDelete() {
    if (deletingId) {
      onDelete(deletingId);
      setDeletingId(null);
    }
  }

  function cancelDelete() {
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">

      {/* ===== FILTROS ===== */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "Todos" },
          { key: "active", label: "Ativos" },
          { key: "inactive", label: "Inativos" },
          { key: "expired", label: "Expirados" },
          { key: "featured", label: "Destaque" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as Filter)}
            className={`
              px-3 py-1.5
              rounded-full
              text-xs
              border
              transition
              ${
                filter === item.key
                  ? "border-[var(--gold)] text-[var(--gold)] bg-[var(--gold)]/10"
                  : "border-white/15 text-white/60 hover:border-white/30"
              }
            `}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ===== LOADING SKELETON ===== */}
      {coupons.length === 0 && (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-2xl bg-white/[0.03] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* ===== DESKTOP TABLE ===== */}
      {coupons.length > 0 && (
        <div
          className="
            hidden md:block
            bs-glass
            border border-white/10
            rounded-3xl
            overflow-hidden
          "
        >
          <table className="w-full text-sm">

            <thead className="bg-white/[0.04]">
              <tr className="text-white/60 text-xs tracking-[0.25em] uppercase">
                <th className="p-5 text-left">Código</th>
                <th className="p-5 text-left">Desconto</th>
                <th className="p-5 text-left">Uso</th>
                <th className="p-5 text-left">Status</th>
                <th className="p-5 text-left">Ações</th>
              </tr>
            </thead>

            <tbody>
              {filteredCoupons.map((coupon) => {
                const expired = isExpired(coupon.expiresAt);

                return (
                  <tr
                    key={coupon.id}
                    className="
                      border-t border-white/10
                      hover:bg-white/[0.03]
                      transition
                    "
                  >
                    <td className="p-5 font-medium">
                      <div className="flex items-center gap-2">
                        <span>{coupon.code}</span>

                        {coupon.isFeatured && (
                          <span
                            className="
                              text-[10px]
                              px-2 py-[2px]
                              rounded-full
                              bg-[var(--gold)]/20
                              text-[var(--gold)]
                              border border-[var(--gold)]/30
                            "
                          >
                            ★ destaque
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-5">
                      <span className="text-white/80">
                        {coupon.discount}%
                      </span>
                    </td>

                    <td className="p-5">
                      <span className="text-white/70">
                        {coupon.used}/{coupon.maxUses}
                      </span>
                    </td>

                    <td className="p-5">
                      {expired ? (
                        <span className="text-xs px-3 py-1 rounded-full bg-red-400/10 text-red-400 border border-red-400/20">
                          Expirado
                        </span>
                      ) : !coupon.active ? (
                        <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-white/40 border border-white/10">
                          Inativo
                        </span>
                      ) : (
                        <span className="text-xs px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                          Ativo
                        </span>
                      )}
                    </td>

                    <td className="p-5">
                      <div className="flex items-center gap-3">

                        <button
                          onClick={() => onEdit(coupon)}
                          className="
                            px-3 py-1.5
                            rounded-md
                            text-xs
                            border border-white/15
                            text-blue-400
                            hover:border-blue-400/40
                            hover:bg-blue-400/10
                            transition
                          "
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => handleDeleteClick(coupon.id)}
                          className="
                            px-3 py-1.5
                            rounded-md
                            text-xs
                            border border-white/15
                            text-red-400
                            hover:border-red-400/40
                            hover:bg-red-400/10
                            transition
                          "
                        >
                          Excluir
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>
      )}

      {/* ===== MOBILE CARDS ===== */}
      {coupons.length > 0 && (
        <div className="md:hidden space-y-4">

          {filteredCoupons.map((coupon) => {
            const expired = isExpired(coupon.expiresAt);

            return (
              <div
                key={coupon.id}
                className="
                  bs-glass
                  border border-white/10
                  rounded-2xl
                  p-4
                  space-y-4
                "
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-white">
                    {coupon.code}
                  </div>

                  {coupon.isFeatured && (
                    <span className="text-[var(--gold)] text-xs">★</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">

                  <div>
                    <p className="text-white/40 text-xs">Desconto</p>
                    <p className="text-white/80">{coupon.discount}%</p>
                  </div>

                  <div>
                    <p className="text-white/40 text-xs">Uso</p>
                    <p className="text-white/80">
                      {coupon.used}/{coupon.maxUses}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-white/40 text-xs">Status</p>

                    {expired ? (
                      <span className="text-red-400 text-xs">Expirado</span>
                    ) : !coupon.active ? (
                      <span className="text-white/40 text-xs">Inativo</span>
                    ) : (
                      <span className="text-green-400 text-xs">Ativo</span>
                    )}
                  </div>

                </div>

                <div className="flex gap-3 pt-2">

                  <button
                    onClick={() => onEdit(coupon)}
                    className="
                      flex-1
                      py-2
                      rounded-lg
                      border border-white/15
                      text-blue-400
                      text-xs
                    "
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => handleDeleteClick(coupon.id)}
                    className="
                      flex-1
                      py-2
                      rounded-lg
                      border border-white/15
                      text-red-400
                      text-xs
                    "
                  >
                    Excluir
                  </button>

                </div>
              </div>
            );
          })}

        </div>
      )}

      {/* ===== MODAL PREMIUM ===== */}
      <ConfirmModal
        open={!!deletingId}
        title="Excluir cupom"
        description="Tem certeza que deseja excluir este cupom? Essa ação não pode ser desfeita."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

    </div>
  );
}