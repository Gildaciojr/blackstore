"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, User } from "lucide-react";
import { useCart } from "@/store/cart";
import { useEffect, useState } from "react";

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

      <div className={`
        max-w-7xl mx-auto px-4 md:px-8
        flex flex-col md:flex-row items-center justify-between
        ${scrolled ? "py-2 md:h-16" : "py-3 md:h-20"}
      `}>

        {/* TOP LINE (LOGO + ICONS) */}
        <div className="w-full flex items-center justify-between">

          {/* LOGO */}
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo-v2.png"
              alt="Blackstore"
              width={120}
              height={40}
              className="object-contain h-[32px] md:h-[40px] w-auto"
              priority
            />
          </Link>

          {/* RIGHT */}
          <div className="flex items-center gap-3 md:gap-5">

            {/* CONTA */}
            <Link
              href="/login"
              className="
              flex items-center gap-2
              text-white/70 text-[10px] md:text-xs uppercase tracking-[0.3em]
              hover:text-[var(--gold)]
              transition
              "
            >
              <User size={16} />
              <span className="hidden sm:inline">Conta</span>
            </Link>

            {/* CARRINHO */}
            <Link
              href="/cart"
              className="
              relative w-10 h-10 
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

        {/* NAV (SEMPRE VISÍVEL, SEM HAMBURGER) */}
        <nav className="
          w-full flex justify-center gap-8 md:gap-12
          text-[10px] md:text-[11px]
          tracking-[0.35em] uppercase
          mt-3 md:mt-0
        ">

          <Link href="/" className="text-white/60 hover:text-[var(--gold)] transition">
            Home
          </Link>

          <Link href="/catalog" className="text-white/60 hover:text-[var(--gold)] transition">
            Catálogo
          </Link>

          <Link href="/login" className="text-white/60 hover:text-[var(--gold)] transition sm:hidden">
            Conta
          </Link>

        </nav>

      </div>

      {/* LINE */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--gold)]/30 to-transparent" />

    </header>
  );
}