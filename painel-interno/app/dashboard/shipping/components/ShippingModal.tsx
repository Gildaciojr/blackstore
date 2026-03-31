"use client";

import { useState, useEffect } from "react";
import { ShippingRate } from "../types/types";
import { apiFetch } from "@/lib/api";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  initialData?: ShippingRate | null;
};

export default function ShippingModal({
  open,
  onClose,
  onSuccess,
  initialData,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    method: "",
    price: "",
    minDays: "",
    maxDays: "",
    cepPrefix: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        method: initialData.method,
        price: String(initialData.price),
        minDays: String(initialData.minDays),
        maxDays: String(initialData.maxDays),
        cepPrefix: initialData.cepPrefix || "",
      });
    } else {
      setForm({
        name: "",
        method: "",
        price: "",
        minDays: "",
        maxDays: "",
        cepPrefix: "",
      });
    }
  }, [initialData]);

  if (!open) return null;

  async function handleSubmit() {
    if (!form.name || !form.method) {
      alert("Preencha nome e método");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: form.name,
        method: form.method,
        price: Number(form.price),
        minDays: Number(form.minDays),
        maxDays: Number(form.maxDays),
        cepPrefix: form.cepPrefix || null,
      };

      if (initialData) {
        await apiFetch(`/admin/shipping/${initialData.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(`/admin/shipping`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      await onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar frete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* OVERLAY */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* MODAL */}
      <div
        className="
        relative z-10
        w-full max-w-2xl
        rounded-3xl
        border border-white/10
        bg-[#0b0b0d]/95
        backdrop-blur-xl
        p-8
        space-y-8
      "
      >
        {/* HEADER */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">
            Logística
          </p>

          <h2 className="text-2xl font-light">
            {initialData ? "Editar frete" : "Novo frete"}
          </h2>
        </div>

        {/* FORM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* NOME */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs uppercase tracking-widest text-white/50">
              Nome
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="
                w-full px-4 py-3 rounded-xl
                bg-black border border-white/10
                focus:border-[var(--gold)]
                outline-none
                transition
              "
            />
          </div>

          {/* MÉTODO */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/50">
              Método
            </label>
            <input
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
              className="
                w-full px-4 py-3 rounded-xl
                bg-black border border-white/10
                focus:border-[var(--gold)]
                outline-none
                transition
              "
            />
          </div>

          {/* PREÇO */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/50">
              Preço
            </label>
            <input
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="
                w-full px-4 py-3 rounded-xl
                bg-black border border-white/10
                focus:border-[var(--gold)]
                outline-none
                transition
              "
            />
          </div>

          {/* PRAZO */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/50">
              Dias mínimos
            </label>
            <input
              value={form.minDays}
              onChange={(e) => setForm({ ...form, minDays: e.target.value })}
              className="
                w-full px-4 py-3 rounded-xl
                bg-black border border-white/10
                focus:border-[var(--gold)]
                outline-none
                transition
              "
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/50">
              Dias máximos
            </label>
            <input
              value={form.maxDays}
              onChange={(e) => setForm({ ...form, maxDays: e.target.value })}
              className="
                w-full px-4 py-3 rounded-xl
                bg-black border border-white/10
                focus:border-[var(--gold)]
                outline-none
                transition
              "
            />
          </div>

          {/* CEP */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs uppercase tracking-widest text-white/50">
              Prefixo de CEP (opcional)
            </label>
            <input
              value={form.cepPrefix}
              onChange={(e) => setForm({ ...form, cepPrefix: e.target.value })}
              className="
                w-full px-4 py-3 rounded-xl
                bg-black border border-white/10
                focus:border-[var(--gold)]
                outline-none
                transition
              "
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={onClose}
            className="
              text-xs uppercase tracking-[0.3em]
              text-white/50
              hover:text-white
              transition
            "
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="
              px-8 py-3
              rounded-full
              bg-[var(--gold)]
              text-black
              text-xs
              uppercase tracking-[0.35em]
              hover:scale-105 active:scale-[0.98]
              transition
              disabled:opacity-50
            "
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
