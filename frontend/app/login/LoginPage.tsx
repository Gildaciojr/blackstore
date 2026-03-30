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
    address: "",
    cep: "",
    uf: "",
    phone: "",
    email: "",
    password: "",
  });

  async function handleLogin() {
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

  async function handleRegister() {
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
    <section className="relative min-h-screen flex items-center justify-center px-6 py-28 bg-[#b0b0d] overflow-hidden">
      <div className="pointer-events-none absolute top-[-200px] left-1/2 -translate-x-1/2  w-[700px] h-[700px] bg-[var(--gold)] opacity-10 blur-[180px]" />
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-20 items-center">
        <div className="w-full max-w-md">
          <p className="uppercase text-xs tracking-[0.35em] text-white/40">
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

          <div className="mt-10 border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
            <div className="mb-6">
              <label className="text-xs uppercase tracking-[0.3em] text-white/40">
                E-mail
              </label>

              <input
                type="email"
                placeholder="seu@email.com"
                className="mt-2 w-full bg-black border border-white/10 px-4 py-3 rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] transition"
                onChange={(e) =>
                  setLogin({
                    ...login,
                    email: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-white/40">
                Senha
              </label>

              <input
                type="password"
                placeholder="••••••••"
                className="mt-2 w-full bg-black border border-white/10 px-4 py-3 rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)] transition"
                onChange={(e) =>
                  setLogin({
                    ...login,
                    password: e.target.value,
                  })
                }
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full mt-8 py-4 rounded-full bg-[var(--gold)] text-black text-xs tracking-[0.35em] uppercase font-medium hover:scale-[1.03] hover:shadow-[0_10px_40px_rgba(212,175,55,0.35)] active:scale-[0.97] transition"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </div>

          {!isAdmin && (
            <p className="mt-6 text-sm text-white/60">
              Ainda não tem conta?{" "}
              <button
                onClick={() => setShowRegister(true)}
                className="text-[var(--gold)] underline underline-offset-4"
              >
                Criar conta
              </button>
            </p>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="border border-white/10 rounded-xl p-12 bg-gradient-to-br from-black/60 via-[#1a1408] to-black">
            <h2 className="text-lg uppercase tracking-[0.35em] text-white/80">
              Experiência Blackstore
            </h2>

            <p className="mt-4 text-white/60 text-sm leading-relaxed">
              Ao criar sua conta você terá acesso a uma experiência premium
              dentro da Blackstore.
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

      {showRegister && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl overflow-y-auto">

          {/* GLOW BACKGROUND */}
          <div
            className="
              pointer-events-none absolute 
              top-[-200px] left-1/2 -translate-x-1/2
              w-[700px] h-[700px]
              bg-[var(--gold)] opacity-10 blur-[180px]
            "
          />

          <div className="min-h-screen flex md:items-center justify-center px-4 py-10 relative">

            <div
              className="
                w-full max-w-lg 
                rounded-2xl 
                bs-glass 
                p-6 md:p-10
                border border-white/10
                bg-white/[0.02]
                backdrop-blur-xl
                shadow-[0_20px_80px_rgba(0,0,0,0.6)]
              "
            >

              {/* HEADER */}
              <div className="mb-6 md:mb-8">
                <h2
                  className="
                    text-xl md:text-2xl 
                    uppercase tracking-[0.35em]
                    bg-gradient-to-r from-white to-white/70
                    bg-clip-text text-transparent
                  "
                >
                  Criar conta
                </h2>

                <p className="text-white/50 text-sm mt-3">
                  Experiência premium Blackstore.
                </p>
              </div>

              {/* FORM */}
              <div className="space-y-4 md:space-y-5">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    placeholder="Nome"
                    className="
                      bg-black/40 border border-white/10 
                      px-4 py-3 rounded-lg text-sm text-white
                      focus:outline-none
                      focus:border-[var(--gold)]
                      focus:ring-1 focus:ring-[var(--gold)]
                      transition-all duration-300
                    "
                    onChange={(e) =>
                      setRegister({
                        ...register,
                        name: e.target.value,
                      })
                    }
                  />

                  <input
                    placeholder="Sobrenome"
                    className="
                      bg-black/40 border border-white/10 
                      px-4 py-3 rounded-lg text-sm text-white
                      focus:outline-none
                      focus:border-[var(--gold)]
                      focus:ring-1 focus:ring-[var(--gold)]
                      transition-all duration-300
                    "
                    onChange={(e) =>
                      setRegister({
                        ...register,
                        surname: e.target.value,
                      })
                    }
                  />
                </div>

                <input
                  placeholder="Email"
                  className="
                    w-full bg-black/40 border border-white/10 
                    px-4 py-3 rounded-lg text-sm text-white
                    focus:outline-none
                    focus:border-[var(--gold)]
                    focus:ring-1 focus:ring-[var(--gold)]
                    transition-all duration-300
                  "
                  onChange={(e) =>
                    setRegister({
                      ...register,
                      email: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Telefone"
                  className="
                    w-full bg-black/40 border border-white/10 
                    px-4 py-3 rounded-lg text-sm text-white
                    focus:outline-none
                    focus:border-[var(--gold)]
                    focus:ring-1 focus:ring-[var(--gold)]
                    transition-all duration-300
                  "
                  onChange={(e) =>
                    setRegister({
                      ...register,
                      phone: e.target.value,
                    })
                  }
                />

                <input
                  type="password"
                  placeholder="Senha"
                  className="
                    w-full bg-black/40 border border-white/10 
                    px-4 py-3 rounded-lg text-sm text-white
                    focus:outline-none
                    focus:border-[var(--gold)]
                    focus:ring-1 focus:ring-[var(--gold)]
                    transition-all duration-300
                  "
                  onChange={(e) =>
                    setRegister({
                      ...register,
                      password: e.target.value,
                    })
                  }
                />
              </div>

              {/* BENEFÍCIOS */}
              <div
                className="
                  mt-6 md:mt-8 
                  p-5 
                  rounded-xl 
                  bg-gradient-to-br from-white/[0.04] to-white/[0.01]
                  border border-white/10 
                  text-xs text-white/60 
                  space-y-2
                "
              >
                <p>✔ Checkout mais rápido</p>
                <p>✔ Ofertas exclusivas</p>
                <p>✔ Histórico de pedidos</p>
              </div>

              {/* ACTIONS */}
              <div
                className="
                  flex flex-col md:flex-row 
                  justify-between gap-4 md:items-center 
                  mt-8 md:mt-10
                "
              >
                <button
                  onClick={() => setShowRegister(false)}
                  className="
                    text-white/50 hover:text-white 
                    transition text-sm
                  "
                >
                  Cancelar
                </button>

                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="
                    w-full md:w-auto 
                    px-8 py-4 
                    rounded-full 
                    bg-[var(--gold)] text-black 
                    text-xs tracking-[0.35em] uppercase
                    transition-all duration-300
                    hover:scale-[1.05]
                    hover:shadow-[0_10px_40px_rgba(212,175,55,0.35)]
                    active:scale-[0.97]
                  "
                >
                  {loading ? "Criando..." : "Criar conta"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )};
    </section>
  );
}