"use client";

import Image from "next/image";
import { useAuth } from "@/store/auth";

export default function AdminHeader() {
  const logout = useAuth((s) => s.logout);

  return (
    <header className="flex items-center justify-between mb-8 md:mb-12 gap-4">

      <Image
        src="/logo-saray.png"
        alt="Blackstore"
        width={140}
        height={50}
        className="
        w-[120px] sm:w-[140px] md:w-[160px]
        opacity-90
        drop-shadow-[0_0_20px_rgba(212,175,55,0.15)]
        "
      />

      <button
        onClick={logout}
        className="
        px-4 sm:px-6 py-2 sm:py-3
        rounded-full
        border border-white/20
        text-[10px] sm:text-xs
        tracking-[0.25em] sm:tracking-[0.3em]
        uppercase
        whitespace-nowrap
        hover:border-[var(--gold)]
        hover:text-[var(--gold)]
        transition
        "
      >
        Sair
      </button>
    </header>
  );
}