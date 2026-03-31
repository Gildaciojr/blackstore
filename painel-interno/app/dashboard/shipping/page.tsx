"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import ShippingTable from "./components/ShippingTable";
import ShippingModal from "./components/ShippingModal";
import { ShippingRate } from "./types/types";

export default function ShippingPage() {
  const [data, setData] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 controle do modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingRate | null>(null);

  async function load() {
    try {
      const res = await apiFetch<ShippingRate[]>("/admin/shipping");
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir este frete?")) return;

    try {
      await apiFetch(`/admin/shipping/${id}`, {
        method: "DELETE",
      });

      await load();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir frete");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="p-10">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl">Fretes</h1>

        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="px-4 py-2 bg-[var(--gold)] text-black rounded-md text-sm"
        >
          Novo frete
        </button>
      </div>

      <ShippingTable
        data={data}
        onEdit={(item) => {
          setEditing(item);
          setOpen(true);
        }}
        onDelete={handleDelete}
      />

      {/* 🔥 MODAL */}
      <ShippingModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={load}
        initialData={editing}
      />
    </div>
  );
}
