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
    <section className="min-h-screen flex items-center justify-center px-6 py-28 bg-[#0b0b0d]">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-20 items-center">
        <div className="w-full max-w-md">
          <p className="uppercase text-xs tracking-[0.35em] text-white/40">
            Blackstore
          </p>

          <h1 className="mt-4 text-4xl md:text-5xl font-light">
            {isAdmin ? "Acesso restrito" : "Entrar"}
          </h1>

          <p className="mt-4 text-white/60 text-sm leading-relaxed">
            {isAdmin
              ? "Área exclusiva do administrador Blackstore."
              : "Entre em sua conta para acompanhar pedidos e acessar benefícios exclusivos."}
          </p>

          <div className="mt-10 border border-white/10 bg-black/40 backdrop-blur-md p-8 rounded-xl">
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
              className="w-full mt-8 py-4 rounded-full bg-[var(--gold)] text-black text-xs tracking-[0.35em] uppercase font-medium hover:scale-[1.03] transition"
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
          <div className="border border-white/10 rounded-xl p-12 bg-gradient-to-b from-black/40 to-black/10">
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl overflow-y-auto">
          <div className="min-h-screen flex md:items-center justify-center px-4 py-10">
            <div className="w-full max-w-lg rounded-2xl bs-glass p-6 md:p-10">
              {/* HEADER */}
              <div className="mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl uppercase tracking-[0.35em]">
                  Criar conta
                </h2>

                <p className="text-white/50 text-sm mt-3">
                  Experiência premium Blackstore.
                </p>
              </div>

              {/* FORM */}
              <div className="space-y-4 md:space-y-5">
                {/* MOBILE = 1 coluna | DESKTOP = 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    placeholder="Nome"
                    className="bg-black/40 border border-white/10 px-4 py-3 rounded-lg text-sm focus:border-[var(--gold)] transition"
                    onChange={(e) =>
                      setRegister({
                        ...register,
                        name: e.target.value,
                      })
                    }
                  />

                  <input
                    placeholder="Sobrenome"
                    className="bg-black/40 border border-white/10 px-4 py-3 rounded-lg text-sm focus:border-[var(--gold)] transition"
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
                  className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-lg text-sm focus:border-[var(--gold)] transition"
                  onChange={(e) =>
                    setRegister({
                      ...register,
                      email: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Telefone"
                  className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-lg text-sm focus:border-[var(--gold)] transition"
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
                  className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-lg text-sm focus:border-[var(--gold)] transition"
                  onChange={(e) =>
                    setRegister({
                      ...register,
                      password: e.target.value,
                    })
                  }
                />
              </div>

              {/* BENEFÍCIOS */}
              <div className="mt-6 md:mt-8 p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/60 space-y-2">
                <p>✔ Checkout mais rápido</p>
                <p>✔ Ofertas exclusivas</p>
                <p>✔ Histórico de pedidos</p>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center mt-8 md:mt-10">
                <button
                  onClick={() => setShowRegister(false)}
                  className="text-white/50 hover:text-white transition text-sm"
                >
                  Cancelar
                </button>

                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-4 rounded-full bg-[var(--gold)] text-black text-xs tracking-[0.35em] uppercase hover:scale-105 transition"
                >
                  {loading ? "Criando..." : "Criar conta"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
