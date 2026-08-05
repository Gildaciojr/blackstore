"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useCart } from "@/store/cart";
import { Tag, Check, X } from "lucide-react";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (appliedCouponCode) {
      setCode(appliedCouponCode);
    }
  }, [appliedCouponCode]);

  async function applyCoupon() {
    if (!code.trim()) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      // 🔥 Chamada real ao backend com tratamento estrito de tipos
      const coupon = await apiFetch<CouponResponse>(
        `/coupons/${code.trim().toUpperCase()}`
      );

      // 🔥 Aplicação no Zustand
      await applyCouponStore(coupon.code);

      const discountValue = subtotal * (coupon.discount / 100);

      if (onApply) {
        onApply(discountValue, coupon.code);
      }
    } catch {
      setErrorMessage("Cupom inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  }

  function handleRemove() {
    removeCoupon();
    setCode("");
    setErrorMessage(null);
  }

  const isApplied = !!appliedCouponCode;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 mt-6 shadow-xl">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center text-[var(--gold)]">
          <Tag size={14} />
        </div>
        <h3 className="text-xs uppercase tracking-[0.3em] text-white/80 font-medium">
          Cupom de desconto
        </h3>
      </div>

      <div className="flex gap-3">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (errorMessage) setErrorMessage(null);
          }}
          placeholder="EX: BLACK10"
          className="flex-1 bg-black/60 border border-white/15 px-4 py-3 rounded-xl text-sm text-white uppercase placeholder:text-white/30 placeholder:normal-case focus:outline-none focus:border-[var(--gold)] transition-colors"
          disabled={isApplied}
        />

        {!isApplied ? (
          <button
            onClick={applyCoupon}
            disabled={loading || !code.trim()}
            className="px-6 py-3 rounded-xl bg-[var(--gold)] text-black text-xs uppercase tracking-[0.25em] font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? "Validando..." : "Aplicar"}
          </button>
        ) : (
          <button
            onClick={handleRemove}
            className="px-6 py-3 rounded-xl border border-white/20 text-white/80 text-xs uppercase tracking-[0.25em] hover:border-red-400 hover:text-red-400 transition-all flex items-center gap-1.5"
          >
            <X size={14} /> Remover
          </button>
        )}
      </div>

      {/* FEEDBACK DE ERRO INLINE */}
      {errorMessage && (
        <p className="mt-3 text-red-400 text-xs tracking-wider">
          {errorMessage}
        </p>
      )}

      {/* BANNER DE SUCESSO VERIFICADO */}
      {isApplied && (
        <div className="mt-3.5 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-2.5 text-emerald-400 text-xs tracking-wide">
          <Check size={16} className="stroke-[3]" />
          <span>
            Cupom <strong className="font-mono">{appliedCouponCode}</strong> aplicado com sucesso!
          </span>
        </div>
      )}
    </div>
  );
}