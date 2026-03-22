"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Menu, X, User } from "lucide-react";
import { useCart } from "@/store/cart";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {

  const count = useCart((s) => s.count());
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? "backdrop-blur-2xl bg-black/70 border-b border-white/10"
            : "bg-transparent"
        }`}
      >

        <div className={`
          max-w-7xl mx-auto px-4 md:px-8
          flex items-center justify-between
          ${scrolled ? "h-14 md:h-16" : "h-16 md:h-20"}
        `}>

          {/* LEFT */}
          <div className="flex items-center gap-4">

            {/* MENU MOBILE */}
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center border border-white/10 rounded-full"
            >
              <Menu size={18} />
            </button>

            {/* LOGO AJUSTADA */}
            <Link href="/" className="flex items-center h-full">
              <Image
                src="/images/logo-v2.png"
                alt="Blackstore"
                width={120}
                height={40}
                className="object-contain h-[32px] md:h-[40px] w-auto"
                priority
              />
            </Link>

          </div>

          {/* NAV DESKTOP */}
          <nav className="hidden md:flex items-center gap-10 text-[11px] tracking-[0.35em] uppercase">

            <Link href="/" className="text-white/60 hover:text-[var(--gold)] transition">
              Home
            </Link>

            <Link href="/catalog" className="text-white/60 hover:text-[var(--gold)] transition">
              Catálogo
            </Link>

          </nav>

          {/* RIGHT */}
          <div className="flex items-center gap-3 md:gap-5">

            {/* CONTA (AGORA CLARO) */}
            <Link
              href="/login"
              className="
              hidden md:flex items-center gap-2
              text-white/70 text-xs uppercase tracking-[0.3em]
              hover:text-[var(--gold)]
              transition
              "
            >
              <User size={16} />
              Conta
            </Link>

            {/* CARRINHO */}
            <Link
              href="/cart"
              className="
              relative w-10 h-10 md:w-11 md:h-11 
              flex items-center justify-center 
              rounded-full 
              border border-white/10 
              bg-black/40 backdrop-blur
              hover:border-[var(--gold)]/40
              transition
              "
            >
              <ShoppingBag size={18} />

              {count > 0 && (
                <span className="
                  absolute -top-1 -right-1 
                  min-w-5 h-5 px-1 
                  rounded-full 
                  bg-[var(--gold)] text-black 
                  text-[10px] flex items-center justify-center
                ">
                  {count}
                </span>
              )}
            </Link>

          </div>

        </div>

        {/* LINE */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--gold)]/30 to-transparent" />

      </header>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/70 z-50"
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.4 }}
              className="fixed top-0 left-0 w-[80%] max-w-sm h-full bg-[#0b0b0d] z-50 border-r border-white/10 p-6 flex flex-col"
            >

              <button
                onClick={() => setMenuOpen(false)}
                className="self-end mb-8"
              >
                <X size={22} />
              </button>

              <nav className="flex flex-col gap-6 text-sm uppercase tracking-widest">

                <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
                <Link href="/catalog" onClick={() => setMenuOpen(false)}>Catálogo</Link>
                <Link href="/login" onClick={() => setMenuOpen(false)}>Conta</Link>
                <Link href="/cart" onClick={() => setMenuOpen(false)}>Carrinho</Link>

              </nav>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}