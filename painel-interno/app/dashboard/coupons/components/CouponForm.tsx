"use client";

import { useState } from "react";
import { Coupon } from "../types/types";

type Props = {
  editing: Coupon | null;
  onSave: (data: {
    code: string;
    discount: number;
    maxUses: number;
    expiresAt: string;
    isFeatured: boolean;
    active: boolean;
  }) => Promise<void>;
  onCancel: () => void;
};

type FormState = {
  code: string;
  discount: number;
  maxUses: number;
  expiresAt: string;
  isFeatured: boolean;
  active: boolean;
};

export default function CouponForm({ editing, onSave, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(() => ({
    code: editing?.code ?? "",
    discount: editing?.discount ?? 0,
    maxUses: editing?.maxUses ?? 0,
    expiresAt: editing?.expiresAt?.slice(0, 10) ?? "",
    isFeatured: editing?.isFeatured ?? false,
    active: editing?.active ?? true,
  }));

  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit() {
    if (!form.code) {
      alert("Código obrigatório");
      return;
    }

    if (form.discount < 1 || form.discount > 90) {
      alert("Desconto deve estar entre 1% e 90%");
      return;
    }

    try {
      setLoading(true);

      await onSave({
        code: form.code.toUpperCase(),
        discount: form.discount,
        maxUses: form.maxUses,
        expiresAt: form.expiresAt,
        isFeatured: form.isFeatured,
        active: form.active,
      });

      setForm({
        code: "",
        discount: 0,
        maxUses: 0,
        expiresAt: "",
        isFeatured: false,
        active: true,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-white/10 p-8 mb-12 rounded-2xl bg-white/[0.02]">
      <h2 className="mb-6 text-xl tracking-widest uppercase">
        {editing ? "Editar cupom" : "Novo cupom"}
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <input
          value={form.code}
          onChange={(e) =>
            updateField("code", e.target.value.toUpperCase())
          }
          placeholder="Código"
          className="bg-black border border-white/20 p-3 rounded-md"
        />

        <input
          type="number"
          value={form.discount}
          onChange={(e) =>
            updateField("discount", Number(e.target.value))
          }
          placeholder="Desconto (%)"
          className="bg-black border border-white/20 p-3 rounded-md"
        />

        <input
          type="number"
          value={form.maxUses}
          onChange={(e) =>
            updateField("maxUses", Number(e.target.value))
          }
          placeholder="Limite de uso"
          className="bg-black border border-white/20 p-3 rounded-md"
        />

        <input
          type="date"
          value={form.expiresAt}
          onChange={(e) =>
            updateField("expiresAt", e.target.value)
          }
          className="bg-black border border-white/20 p-3 rounded-md"
        />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <label className="flex items-center gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) =>
              updateField("isFeatured", e.target.checked)
            }
          />
          Destacar no Hero
        </label>

        <label className="flex items-center gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) =>
              updateField("active", e.target.checked)
            }
          />
          Cupom ativo
        </label>
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-3 bg-[var(--gold)] text-black rounded-md hover:scale-105 transition disabled:opacity-50"
        >
          {loading ? "Salvando..." : editing ? "Atualizar" : "Criar"}
        </button>

        {editing && (
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-white/20 rounded-md"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}