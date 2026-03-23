"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, User } from "lucide-react";
import { useCart } from "@/store/cart";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Header() {
  const count = useCart((s) => s.count());
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-2xl bg-black/70 border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      {/* TOP ROW */}
      <div
        className={`
          max-w-7xl mx-auto px-4 md:px-6
          flex items-center justify-between
          ${scrolled ? "h-12 md:h-16" : "h-14 md:h-20"}
        `}
      >
        {/* LOGO */}
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo-v2.png"
            alt="Blackstore"
            width={120}
            height={40}
            className="object-contain h-[28px] md:h-[42px] w-auto"
            priority
          />
        </Link>

        {/* NAV DESKTOP */}
        <nav className="hidden md:flex items-center gap-10 text-[11px] tracking-[0.35em] uppercase">

          <Link
            href="/"
            className="relative group text-white/70 hover:text-white transition"
          >
            Home
            <span className="absolute left-0 -bottom-2 w-0 h-[1px] bg-[var(--gold)] transition-all group-hover:w-full" />
          </Link>

          <Link
            href="/catalog"
            className="relative group text-white/70 hover:text-white transition"
          >
            Catálogo
            <span className="absolute left-0 -bottom-2 w-0 h-[1px] bg-[var(--gold)] transition-all group-hover:w-full" />
          </Link>

        </nav>

        {/* RIGHT */}
        <div className="flex items-center gap-2 md:gap-5">

          {/* CONTA */}
          <Link
            href="/login"
            className="flex items-center justify-center w-9 h-9 md:w-auto md:h-auto md:px-3 md:py-2 rounded-full md:rounded-none border md:border-none border-white/10 bg-black/40 md:bg-transparent backdrop-blur md:backdrop-blur-none text-white/70 hover:text-[var(--gold)] transition"
          >
            <User size={17} />

            <span className="hidden md:inline text-xs uppercase tracking-[0.3em] ml-2">
              Conta
            </span>
          </Link>

          {/* CART */}
          <Link
            href="/cart"
            className="relative w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full border border-white/10 bg-black/40 backdrop-blur hover:border-[var(--gold)]/40 transition"
          >
            <ShoppingBag size={17} />

            {count > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 text-[10px] bg-[var(--gold)] text-black w-5 h-5 flex items-center justify-center rounded-full font-medium"
              >
                {count}
              </motion.span>
            )}
          </Link>

        </div>
      </div>

      {/* 🔥 MOBILE NAV (NOVA CAMADA) */}
      <div className="md:hidden px-4 pb-2">

        <div className="flex justify-center gap-8 text-[11px] tracking-[0.35em] uppercase">

          <Link
            href="/"
            className="text-white/70 hover:text-[var(--gold)] transition"
          >
            Home
          </Link>

          <Link
            href="/catalog"
            className="text-white/70 hover:text-[var(--gold)] transition"
          >
            Catálogo
          </Link>

        </div>

      </div>

      {/* LINE */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--gold)]/40 to-transparent opacity-80" />
    </header>
  );
}