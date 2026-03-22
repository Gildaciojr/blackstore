"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useCart } from "@/store/cart";

type Props = {
  subtotal: number;
  onApply?: (discount: number, code: string) => void;
};

type CouponResponse = {
  code: string;
  discount: number;
};

export default function CouponInput({ subtotal, onApply }: Props) {

  const {
    applyCoupon: applyCouponStore,
    removeCoupon,
    appliedCouponCode,
    discount,
  } = useCart();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (appliedCouponCode) {
      setCode(appliedCouponCode);
    }
  }, [appliedCouponCode]);

  async function applyCoupon() {

    if (!code) return;

    setLoading(true);

    try {

      // 🔥 chama backend (validação real)
      const coupon = await apiFetch<CouponResponse>(
        `/coupons/${code.toUpperCase()}`
      );

      // 🔥 aplica no Zustand
      await applyCouponStore(coupon.code);

      const discountValue = subtotal * (coupon.discount / 100);

      // 🔥 mantém compatibilidade com fluxo antigo
      if (onApply) {
        onApply(discountValue, coupon.code);
      }

    } catch {

      alert("Cupom inválido ou expirado");

    } finally {

      setLoading(false);

    }
  }

  function handleRemove() {
    removeCoupon();
    setCode("");
  }

  const isApplied = !!appliedCouponCode;

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
          disabled={isApplied}
        />

        {!isApplied ? (
          <button
            onClick={applyCoupon}
            disabled={loading}
            className="px-4 py-2 bg-white text-black"
          >
            {loading ? "..." : "Aplicar"}
          </button>
        ) : (
          <button
            onClick={handleRemove}
            className="px-4 py-2 border border-white/20 text-white"
          >
            Remover
          </button>
        )}

      </div>

      {isApplied && (
        <p className="mt-2 text-green-400 text-sm">
          Cupom {appliedCouponCode} aplicado
        </p>
      )}

    </div>

  );
}