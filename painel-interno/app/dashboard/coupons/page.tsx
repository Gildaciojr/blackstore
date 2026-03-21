"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import CouponForm from "./components/CouponForm";
import CouponTable from "./components/CouponTable";
import { Coupon } from "./types/types";

export default function CouponsPage() {

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editing, setEditing] = useState<Coupon | null>(null);

  async function loadCoupons() {

    const data = await apiFetch<Coupon[]>("/admin/coupons");

    setCoupons(data);

  }

useEffect(() => {

  async function init() {
    await loadCoupons();
  }

  init();

}, []);

  async function handleSave(data: {
    code: string;
    discount: number;
    maxUses: number;
    expiresAt: string;
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

    await loadCoupons();

  }

  return (

    <section>

      <h1 className="text-3xl mb-10">

        Cupons

      </h1>

      <CouponForm
        editing={editing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />

      <CouponTable
        coupons={coupons}
        onEdit={setEditing}
        onDelete={handleDelete}
      />

    </section>

  );

}