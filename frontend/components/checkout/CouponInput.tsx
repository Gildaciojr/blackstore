"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

type Props = {
  subtotal: number;
  onApply: (discount: number, code: string) => void;
};

type CouponResponse = {
  code: string;
  discount: number;
};

export default function CouponInput({ subtotal, onApply }: Props) {

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  async function applyCoupon() {

    if (!code) return;

    setLoading(true);

    try {

      const coupon = await apiFetch<CouponResponse>(
        `/coupons/${code.toUpperCase()}`
      );

      const discountValue = subtotal * (coupon.discount / 100);

      onApply(discountValue, coupon.code);

      setApplied(true);

    } catch {

      alert("Cupom inválido ou expirado");

    } finally {

      setLoading(false);

    }
  }

  return (

    <div className="border border-white/10 p-4 mt-6">

      <h3 className="mb-3 text-lg">
        Cupom de desconto
      </h3>

      <div className="flex gap-3">

        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Digite seu cupom"
          className="flex-1 bg-black border border-white/20 p-2"
          disabled={applied}
        />

        <button
          onClick={applyCoupon}
          disabled={loading || applied}
          className="px-4 py-2 bg-white text-black"
        >
          {loading ? "..." : applied ? "Aplicado" : "Aplicar"}
        </button>

      </div>

    </div>

  );
}