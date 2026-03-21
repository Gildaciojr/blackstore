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
  }) => Promise<void>;
  onCancel: () => void;
};

export default function CouponForm({ editing, onSave, onCancel }: Props) {

  const [code, setCode] = useState(editing?.code ?? "");
  const [discount, setDiscount] = useState(editing?.discount ?? 0);
  const [maxUses, setMaxUses] = useState(editing?.maxUses ?? 0);
  const [expiresAt, setExpiresAt] = useState(
    editing?.expiresAt?.slice(0, 10) ?? ""
  );

  async function handleSubmit() {

    if (!code) {
      alert("Código obrigatório");
      return;
    }

    await onSave({
      code,
      discount,
      maxUses,
      expiresAt,
    });

    setCode("");
    setDiscount(0);
    setMaxUses(0);
    setExpiresAt("");
  }

  return (
    <div className="border border-white/10 p-8 mb-12">

      <h2 className="mb-6 text-xl">
        {editing ? "Editar cupom" : "Novo cupom"}
      </h2>

      <div className="grid grid-cols-2 gap-4">

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Código"
          className="bg-black border border-white/20 p-3"
        />

        <input
          type="number"
          value={discount}
          onChange={(e) => setDiscount(Number(e.target.value))}
          placeholder="Desconto (%)"
          className="bg-black border border-white/20 p-3"
        />

        <input
          type="number"
          value={maxUses}
          onChange={(e) => setMaxUses(Number(e.target.value))}
          placeholder="Limite de uso"
          className="bg-black border border-white/20 p-3"
        />

        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="bg-black border border-white/20 p-3"
        />

      </div>

      <div className="mt-6 flex gap-4">

        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-white text-black"
        >
          {editing ? "Atualizar" : "Criar"}
        </button>

        {editing && (
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-white/20"
          >
            Cancelar
          </button>
        )}

      </div>

    </div>
  );
}