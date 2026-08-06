"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Sparkles, Check, X, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useCart } from "@/store/cart";

type FeaturedCoupon = {
  id: string;
  code: string;
  discount: number;
  maxUses: number;
  used: number;
  expiresAt: string;
};

export default function CouponFloatingBanner() {
  const [coupon, setCoupon] = useState<FeaturedCoupon | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const { applyCoupon, appliedCouponCode } = useCart();

  // Função de fechar declarada antes de ser utilizada nos efeitos
  const handleClose = useCallback(() => {
    setIsVisible(false);
    sessionStorage.setItem("bs_promo_coupon_dismissed", "true");
  }, []);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        // Verifica se o usuário já fechou/reclamou o cupom nesta sessão
        const dismissed = sessionStorage.getItem("bs_promo_coupon_dismissed");
        if (dismissed) return;

        const data = await apiFetch<FeaturedCoupon | null>("/coupons-featured");

        if (data && data.code && data.code !== appliedCouponCode) {
          setCoupon(data);

          // Delay sutil para entrada elegante após o carregamento da página
          const timerShow = setTimeout(() => {
            setIsVisible(true);
          }, 1500);

          return () => clearTimeout(timerShow);
        }
      } catch (err) {
        console.error("Erro ao buscar cupom em destaque:", err);
      }
    }

    void fetchFeatured();
  }, [appliedCouponCode]);

  // Auto-dismiss após 9 segundos de exibição se o usuário não clicar
  useEffect(() => {
    if (!isVisible || copied) return;

    const autoHideTimer = setTimeout(() => {
      handleClose();
    }, 9000);

    return () => clearTimeout(autoHideTimer);
  }, [isVisible, copied, handleClose]);

  const handleClaim = async () => {
    if (!coupon) return;

    try {
      // 1. Aplica diretamente na store do Zustand do Carrinho
      await applyCoupon(coupon.code);

      // 2. Copia para o clipboard do usuário
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(coupon.code);
      }

      // 3. Feedback visual imediato
      setCopied(true);

      // 4. Fecha suavemente após mostrar o checkmark de sucesso
      setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem("bs_promo_coupon_dismissed", "true");
      }, 2200);
    } catch (err) {
      console.error("Erro ao aplicar cupom flutuante:", err);
    }
  };

  if (!coupon) return null;

  const remainingUses = Math.max(0, coupon.maxUses - coupon.used);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-5 right-4 sm:right-6 z-50 max-w-[380px] w-[calc(100vw-2rem)]"
        >
          <div className="relative overflow-hidden rounded-2xl border border-[var(--gold)]/40 bg-[#0b0b0d]/90 backdrop-blur-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.15)]">
            {/* EFEITO GLOW DOURADO DE FUNDO */}
            <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[var(--gold)]/15 blur-2xl" />

            {/* BOTÃO FECHAR */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors z-10"
              aria-label="Fechar notificação"
            >
              <X size={14} />
            </button>

            {/* HEADER / BADGE DE ESCASSEZ */}
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--gold)]/15 border border-[var(--gold)]/30 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
                <Sparkles size={11} className="animate-pulse" /> Oportunidade
                Única
              </span>

              {remainingUses > 0 && remainingUses <= 15 && (
                <span className="text-[10px] uppercase tracking-wider text-rose-400 font-medium">
                  Restam {remainingUses} unidades
                </span>
              )}
            </div>

            {/* CORPO DO CUPOM */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h4 className="text-xl font-light text-white tracking-wide flex items-center gap-2">
                  <span className="text-[var(--gold)] font-bold">
                    {coupon.discount}% OFF
                  </span>
                  <span className="text-white/40 text-xs font-normal">
                    na sua compra
                  </span>
                </h4>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  Ganhe desconto exclusivo preenchido automaticamente no seu
                  checkout.
                </p>
              </div>
            </div>

            {/* CARD DO CÓDIGO + AÇÃO DE COPIAR/APLICAR */}
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-black/60 border border-white/10">
              <div className="flex-1 px-3 py-2 font-mono text-sm font-bold tracking-widest text-[var(--gold)] uppercase flex items-center gap-2">
                <Tag size={14} className="text-[var(--gold)]/70" />
                {coupon.code}
              </div>

              <button
                onClick={handleClaim}
                disabled={copied}
                className={`px-4 py-2.5 rounded-lg text-xs uppercase tracking-[0.15em] font-bold transition-all duration-300 flex items-center gap-1.5 shrink-0 ${
                  copied
                    ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    : "bg-[var(--gold)] text-black hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {copied ? (
                  <>
                    <Check size={14} className="stroke-[3]" /> Aplicado!
                  </>
                ) : (
                  <>
                    Garantir <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>

            {/* BARRA DE PROGRESSO TEMPORIZADA (SAÍDA AUTOMÁTICA) */}
            {!copied && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 9, ease: "linear" }}
                  className="h-full bg-gradient-to-r from-[var(--gold)]/40 to-[var(--gold)]"
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}