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
    <div
      className="
        bs-glass
        border border-white/10
        rounded-3xl
        p-5 sm:p-6 md:p-8
        mb-10 md:mb-12
      "
    >
      {/* HEADER */}
      <div className="mb-6 md:mb-8">
        <p className="text-[11px] tracking-[0.4em] uppercase text-white/40">
          Configuração
        </p>

        <h2 className="mt-2 text-lg md:text-xl tracking-[0.3em] uppercase text-white/80">
          {editing ? "Editar cupom" : "Novo cupom"}
        </h2>
      </div>

      {/* GRID PRINCIPAL */}
      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-4
          gap-4
        "
      >
        <input
          value={form.code}
          onChange={(e) =>
            updateField("code", e.target.value.toUpperCase())
          }
          placeholder="Código"
          className="input"
        />

        <input
          type="number"
          value={form.discount}
          onChange={(e) =>
            updateField("discount", Number(e.target.value))
          }
          placeholder="Desconto (%)"
          className="input"
        />

        <input
          type="number"
          value={form.maxUses}
          onChange={(e) =>
            updateField("maxUses", Number(e.target.value))
          }
          placeholder="Limite de uso"
          className="input"
        />

        <input
          type="date"
          value={form.expiresAt}
          onChange={(e) =>
            updateField("expiresAt", e.target.value)
          }
          className="input"
        />
      </div>

      {/* CONFIGURAÇÕES */}
      <div
        className="
          mt-6 md:mt-8
          flex
          flex-col
          sm:flex-row
          sm:items-center
          gap-4 sm:gap-8
        "
      >
        <label
          className="
            flex items-center gap-3
            text-sm text-white/70
            cursor-pointer
          "
        >
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) =>
              updateField("isFeatured", e.target.checked)
            }
          />
          Destacar no Hero
        </label>

        <label
          className="
            flex items-center gap-3
            text-sm text-white/70
            cursor-pointer
          "
        >
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

      {/* AÇÕES */}
      <div
        className="
          mt-6 md:mt-8
          flex
          flex-col sm:flex-row
          gap-3 sm:gap-4
        "
      >
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="
            px-6 py-3
            rounded-xl
            bg-[var(--gold)]
            text-black
            text-sm md:text-base
            font-medium
            transition
            hover:scale-[1.03]
            hover:shadow-[0_0_30px_rgba(212,175,55,0.25)]
            disabled:opacity-50
          "
        >
          {loading ? "Salvando..." : editing ? "Atualizar" : "Criar"}
        </button>

        {editing && (
          <button
            onClick={onCancel}
            className="
              px-6 py-3
              rounded-xl
              border border-white/20
              text-sm md:text-base
              hover:border-white/40
              transition
            "
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}