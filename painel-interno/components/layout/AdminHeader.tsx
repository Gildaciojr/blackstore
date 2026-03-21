"use client";

import Image from "next/image";
import { useAuth } from "@/store/auth";

export default function AdminHeader(){

  const logout = useAuth(s => s.logout);

  return(

    <header
      className="
      flex
      items-center
      justify-between
      mb-12
      "
    >

      <Image
        src="/logo-saray.png"
        alt="Blackstore"
        width={160}
        height={60}
        className="
        opacity-90
        drop-shadow-[0_0_20px_rgba(212,175,55,0.15)]
        "
      />

      <button
        onClick={logout}
        className="
        px-6 py-3
        rounded-full
        border border-white/20
        text-xs
        tracking-[0.3em]
        uppercase
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