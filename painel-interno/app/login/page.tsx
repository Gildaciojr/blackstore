"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/store/auth";

export default function LoginPage() {

  const router = useRouter();
  const login = useAuth((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {

    setLoading(true);

    const ok = await login(email, password);

    setLoading(false);

    if (!ok) {
      alert("Credenciais inválidas");
      return;
    }

    router.push("/dashboard");

  }

  return (

    <main
      className="
      min-h-screen
      flex
      items-center
      justify-center
      bg-[#0b0b0d]
      text-white
      relative
      overflow-hidden
      px-6
      "
    >

      {/* AMBIENT LIGHT */}

      <div
        className="
        absolute
        w-[700px]
        h-[700px]
        bg-[var(--gold)]
        opacity-[0.05]
        blur-[200px]
        rounded-full
        top-[-250px]
        left-1/2
        -translate-x-1/2
        pointer-events-none
        "
      />

      {/* LOGIN */}

      <div
        className="
        relative
        w-full
        max-w-sm
        space-y-10
        "
      >

        {/* LOGO */}

        <div className="flex justify-center">

          <Image
            src="/logo-saray.png"
            alt="Blackstore"
            width={180}
            height={60}
            priority
            className="
            opacity-90
            drop-shadow-[0_0_20px_rgba(212,175,55,0.15)]
            "
          />

        </div>

        {/* TEXT */}

        <div className="text-center space-y-2">

          <h1 className="text-2xl font-light tracking-wide">

            Bem-vinda,
            <span className="text-[var(--gold)] ml-1 font-medium">
              Saray
            </span>

          </h1>

          <p className="text-sm text-white/40">
            Acesse seu painel administrativo
          </p>

        </div>

        {/* FORM */}

        <div className="space-y-4">

          <input
            type="email"
            placeholder="Email"
            onChange={(e)=>setEmail(e.target.value)}
            className="
            w-full
            bg-white/[0.04]
            border border-white/10
            rounded-xl
            p-3.5
            text-sm
            focus:border-[var(--gold)]
            focus:bg-white/[0.06]
            transition
            outline-none
            "
          />

          <input
            type="password"
            placeholder="Senha"
            onChange={(e)=>setPassword(e.target.value)}
            className="
            w-full
            bg-white/[0.04]
            border border-white/10
            rounded-xl
            p-3.5
            text-sm
            focus:border-[var(--gold)]
            focus:bg-white/[0.06]
            transition
            outline-none
            "
          />

        </div>

        {/* BUTTON */}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="
          w-full
          py-3
          rounded-full
          text-xs
          tracking-[0.35em]
          uppercase
          bg-[var(--gold)]
          text-black
          hover:scale-[1.03]
          hover:brightness-110
          transition
          disabled:opacity-60
          disabled:cursor-not-allowed
          "
        >

          {loading ? "Entrando..." : "Entrar"}

        </button>

        {/* FOOTER */}

        <div className="text-center text-xs text-white/30 pt-2">

          Painel administrativo • Blackstore

        </div>

      </div>

    </main>

  );

}