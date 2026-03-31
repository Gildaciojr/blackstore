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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#0b0b0d] p-6 rounded-xl w-full max-w-md border border-white/10 space-y-4">
        <h2 className="text-lg">
          {initialData ? "Editar frete" : "Novo frete"}
        </h2>

        <input
          placeholder="Nome"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full p-2 bg-black border border-white/10 rounded"
        />

        <input
          placeholder="Método (ex: pac)"
          value={form.method}
          onChange={(e) => setForm({ ...form, method: e.target.value })}
          className="w-full p-2 bg-black border border-white/10 rounded"
        />

        <input
          placeholder="Preço"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="w-full p-2 bg-black border border-white/10 rounded"
        />

        <input
          placeholder="Dias mínimos"
          value={form.minDays}
          onChange={(e) => setForm({ ...form, minDays: e.target.value })}
          className="w-full p-2 bg-black border border-white/10 rounded"
        />

        <input
          placeholder="Dias máximos"
          value={form.maxDays}
          onChange={(e) => setForm({ ...form, maxDays: e.target.value })}
          className="w-full p-2 bg-black border border-white/10 rounded"
        />

        <input
          placeholder="Prefixo CEP (opcional)"
          value={form.cepPrefix}
          onChange={(e) => setForm({ ...form, cepPrefix: e.target.value })}
          className="w-full p-2 bg-black border border-white/10 rounded"
        />

        <div className="flex justify-end gap-2 pt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-[var(--gold)] text-black rounded"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
