"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, User } from "lucide-react";
import { useCart } from "@/store/cart";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const count = useCart((s) => s.count());
  const [scrolled, setScrolled] = useState(false);

  // Otimização de Performance: Scroll listener limpo e performático
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 40);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-xl bg-black/85 border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
          : "bg-gradient-to-b from-black/85 via-black/40 to-transparent"
      }`}
    >
      <div
        className={`
          max-w-7xl mx-auto px-4 md:px-6
          flex items-center justify-between
          transition-all duration-500
          ${scrolled ? "h-16 md:h-20" : "h-20 md:h-24"}
        `}
      >
        {/* LOGO REFINADA E PREMIUM */}
        <Link
          href="/"
          className="relative flex items-center group focus:outline-none py-2"
          aria-label="Blackstore Home"
        >
          {/* Aura de brilho dourado sutil ao fundo da logo (Efeito de luxo) */}
          <div className="absolute -inset-2 bg-[var(--gold)] opacity-0 group-hover:opacity-15 blur-xl transition-opacity duration-500 rounded-full pointer-events-none" />

          <div className="relative flex items-center">
            <Image
              src="/images/logo-v2.png"
              alt="Blackstore"
              width={130}
              height={44}
              className="
                object-contain
                h-[34px] md:h-[44px]
                w-auto
                transition-all duration-500
                group-hover:scale-105
                filter drop-shadow-[0_2px_10px_rgba(212,175,55,0.25)]
              "
              priority
            />
          </div>
        </Link>

        {/* NAV DESKTOP & MOBILE INTEGRADA (Clean UX) */}
        <nav className="flex items-center gap-8 md:gap-12 text-[11px] md:text-xs tracking-[0.3em] md:tracking-[0.35em] uppercase font-medium">
          <Link
            href="/"
            className="relative group text-white/80 hover:text-white transition-colors py-1"
          >
            Home
            <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-[var(--gold)] transition-all duration-300 group-hover:w-full" />
          </Link>

          <Link
            href="/catalog"
            className="relative group text-white/80 hover:text-white transition-colors py-1"
          >
            Catálogo
            <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-[var(--gold)] transition-all duration-300 group-hover:w-full" />
          </Link>
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-3 md:gap-6">
          {/* CONTA */}
          <Link
            href="/login"
            aria-label="Minha Conta"
            className="
              flex items-center justify-center
              w-10 h-10 md:w-auto md:h-auto
              md:px-4 md:py-2
              rounded-full md:rounded-none
              bg-white/5 md:bg-transparent
              border border-white/10 md:border-none
              text-white/80 hover:text-[var(--gold)]
              transition-all duration-300
            "
          >
            <User size={18} />
            <span className="hidden md:inline text-xs uppercase tracking-[0.3em] ml-2 font-medium">
              Conta
            </span>
          </Link>

          {/* CART */}
          <Link
            href="/cart"
            aria-label="Carrinho de Compras"
            className="
              relative w-10 h-10 md:w-11 md:h-11
              flex items-center justify-center
              rounded-full
              bg-white/5
              backdrop-blur-sm
              border border-white/10
              hover:border-[var(--gold)]/50
              hover:bg-white/10
              transition-all duration-300
            "
          >
            <ShoppingBag size={18} className="text-white/90" />

            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="
                    absolute -top-1.5 -right-1.5
                    text-[10px] font-bold
                    bg-[var(--gold)]
                    text-black
                    w-5 h-5
                    flex items-center justify-center
                    rounded-full
                    shadow-[0_0_12px_rgba(212,175,55,0.7)]
                  "
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>
      </div>

      {/* LINHA PREMIUM DE DESTAQUE */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[var(--gold)]/40 to-transparent opacity-60" />
    </header>
  );
}