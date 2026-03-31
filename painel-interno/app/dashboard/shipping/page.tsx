"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import ShippingTable from "./components/ShippingTable";
import ShippingModal from "./components/ShippingModal";
import { ShippingRate } from "./types/types";

export default function ShippingPage() {
  const [data, setData] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);

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

    await apiFetch(`/admin/shipping/${id}`, {
      method: "DELETE",
    });

    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="space-y-10">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">
            Logística
          </p>

          <h1 className="text-3xl md:text-4xl font-light mt-2">Fretes</h1>

          <p className="text-white/50 text-sm mt-2 max-w-lg">
            Gerencie regras de envio, prazos e valores por região.
          </p>
        </div>

        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="
            px-6 py-3
            rounded-full
            bg-[var(--gold)]
            text-black
            text-xs
            tracking-[0.35em]
            uppercase
            hover:scale-105 active:scale-[0.98]
            transition
          "
        >
          Novo frete
        </button>
      </div>

      {/* CONTAINER */}
      <div
        className="
        relative
        border border-white/10
        bg-white/[0.02]
        backdrop-blur-xl
        rounded-3xl
        p-6
        overflow-hidden
      "
      >
        {/* glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-[var(--gold)]/10 blur-3xl rounded-full" />

        {/* conteúdo */}
        <div className="relative z-10">
          {loading ? (
            <div className="p-10 text-white/50 text-sm">
              Carregando fretes...
            </div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <p className="text-white/40 text-sm">Nenhum frete cadastrado</p>

              <button
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
                className="
                  px-6 py-3
                  rounded-full
                  border border-white/20
                  text-xs
                  uppercase
                  tracking-[0.35em]
                  hover:border-[var(--gold)]
                  hover:text-[var(--gold)]
                  transition
                "
              >
                Criar primeiro frete
              </button>
            </div>
          ) : (
            <ShippingTable
              data={data}
              onEdit={(item) => {
                setEditing(item);
                setOpen(true);
              }}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      {/* MODAL */}
      <ShippingModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={load}
        initialData={editing}
      />
    </section>
  );
}
