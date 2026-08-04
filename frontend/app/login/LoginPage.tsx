"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/store/auth";

export default function LoginPage() {
  const params = useSearchParams();
  const router = useRouter();

  const loginUser = useAuth((s) => s.login);

  const isAdmin = params.get("admin") === "1";

  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const [login, setLogin] = useState({
    email: "",
    password: "",
  });

  const [register, setRegister] = useState({
    name: "",
    surname: "",
    phone: "",
    email: "",
    password: "",
  });

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);

    /**
     * LOGIN ADMIN
     */
    if (isAdmin) {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(login),
      });

      setLoading(false);

      if (!res.ok) {
        alert("Credenciais inválidas");
        return;
      }

      router.push("/dashboard");
      return;
    }

    /**
     * LOGIN CLIENTE (JWT)
     */
    const success = await loginUser(login.email, login.password);

    setLoading(false);

    if (!success) {
      alert("Credenciais inválidas");
      return;
    }

    const redirect = params.get("redirect");
    router.push(redirect || "/account");
  }

  async function handleRegister(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: register.name,
            surname: register.surname,
            phone: register.phone,
            email: register.email,
            password: register.password,
          }),
        },
      );

      if (!res.ok) {
        setLoading(false);
        alert("Erro ao criar conta");
        return;
      }

      /**
       * Login automático após registro
       */
      const success = await loginUser(register.email, register.password);

      setLoading(false);

      if (!success) {
        alert("Conta criada, mas erro ao logar.");
        return;
      }

      setShowRegister(false);
      const redirect = params.get("redirect");
      router.push(redirect || "/account");
    } catch {
      setLoading(false);
      alert("Erro inesperado ao criar conta");
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-28 bg-black overflow-hidden">
      {/* GLOW DE FUNDO */}
      <div className="pointer-events-none absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[var(--gold)] opacity-10 blur-[180px]" />
      
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-20 items-center relative z-10">
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <p className="uppercase text-xs tracking-[0.35em] text-white/40 font-medium">
            Blackstore
          </p>

          <h1 className="mt-4 text-4xl md:text-5xl font-light bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            {isAdmin ? "Acesso restrito" : "Entrar"}
          </h1>

          <p className="mt-4 text-white/60 text-sm leading-relaxed">
            {isAdmin
              ? "Área exclusiva do administrador Blackstore."
              : "Entre em sua conta para acompanhar pedidos e acessar benefícios exclusivos."}
          </p>

          <form onSubmit={handleLogin} className="mt-10 border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
            <div className="mb-6">
              <label className="text-xs uppercase tracking-[0.3em] text-white/40 block mb-2">
                E-mail
              </label>

              <input
                type="email"
                required
                placeholder="seu@email.com"
                className="w-full bg-black border border-white/10 px-4 py-3 rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] transition"
                onChange={(e) =>
                  setLogin({
                    ...login,
                    email: e.target.value,
                  })
                }
              />
            </div>

            <div className="mb-2">
              <label className="text-xs uppercase tracking-[0.3em] text-white/40 block mb-2">
                Senha
              </label>

              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-black border border-white/10 px-4 py-3 rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] transition"
                onChange={(e) =>
                  setLogin({
                    ...login,
                    password: e.target.value,
                  })
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 py-4 rounded-full bg-[var(--gold)] text-black text-xs tracking-[0.35em] uppercase font-bold hover:scale-[1.02] hover:shadow-[0_10px_40px_rgba(212,175,55,0.35)] active:scale-[0.98] transition disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {!isAdmin && (
            <p className="mt-6 text-sm text-white/60 text-center lg:text-left">
              Ainda não tem conta?{" "}
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="text-[var(--gold)] underline underline-offset-4 hover:text-white transition"
              >
                Criar conta
              </button>
            </p>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="border border-white/10 rounded-2xl p-12 bg-gradient-to-br from-black/60 via-[#1a1408] to-black shadow-2xl">
            <h2 className="text-lg uppercase tracking-[0.35em] text-white/80 font-medium">
              Experiência Blackstore
            </h2>

            <p className="mt-4 text-white/60 text-sm leading-relaxed">
              Ao criar sua conta você terá acesso a uma experiência premium dentro da Blackstore.
            </p>

            <ul className="mt-8 space-y-4 text-white/60 text-sm">
              <li>• Acesso a ofertas exclusivas</li>
              <li>• Histórico completo de pedidos</li>
              <li>• Checkout rápido</li>
              <li>• Pagamento via PIX ou cartão</li>
            </ul>
          </div>
        </div>
      </div>

      {/* MODAL DE CADASTRO */}
      {showRegister && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl overflow-y-auto flex items-center justify-center p-4">
          <div className="pointer-events-none absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[var(--gold)] opacity-10 blur-[180px]" />

          <div className="relative w-full max-w-lg rounded-2xl p-6 md:p-10 border border-white/10 bg-neutral-950 backdrop-blur-xl shadow-2xl">
            <div className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl uppercase tracking-[0.35em] bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent font-medium">
                Criar conta
              </h2>
              <p className="text-white/50 text-sm mt-2">
                Experiência premium Blackstore.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 md:space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Nome"
                  className="bg-black border border-white/10 px-4 py-3 rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] transition"
                  onChange={(e) =>
                    setRegister({
                      ...register,
                      name: e.target.value,
                    })
                  }
                />

                <input
                  type="text"
                  required
                  placeholder="Sobrenome"
                  className="bg-black border border-white/10 px-4 py-3 rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] transition"
                  onChange={(e) =>
                    setRegister({
                      ...register,
                      surname: e.target.value,
                    })
                  }
                />
              </div>

              <input
                type="email"
                required
                placeholder="E-mail"
                className="w-full bg-black border border-white/10 px-4 py-3 rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] transition"
                onChange={(e) =>
                  setRegister({
                    ...register,
                    email: e.target.value,
                  })
                }
              />

              <input
                type="tel"
                placeholder="Telefone"
                className="w-full bg-black border border-white/10 px-4 py-3 rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] transition"
                onChange={(e) =>
                  setRegister({
                    ...register,
                    phone: e.target.value,
                  })
                }
              />

              <input
                type="password"
                required
                placeholder="Senha"
                className="w-full bg-black border border-white/10 px-4 py-3 rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] transition"
                onChange={(e) =>
                  setRegister({
                    ...register,
                    password: e.target.value,
                  })
                }
              />

              <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-white/60 space-y-2">
                <p>✔ Checkout mais rápido</p>
                <p>✔ Ofertas exclusivas</p>
                <p>✔ Histórico de pedidos</p>
              </div>

              <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center pt-4">
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="text-white/50 hover:text-white transition text-sm py-2"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-4 rounded-full bg-[var(--gold)] text-black text-xs tracking-[0.35em] uppercase font-bold transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? "Criando..." : "Criar conta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}