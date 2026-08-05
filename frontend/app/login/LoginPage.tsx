"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/store/auth";

export default function LoginPage() {
  const params = useSearchParams();
  const router = useRouter();

  const loginUser = useAuth((s) => s.login);

  const isAdmin = params.get("admin") === "1";

  // Tab state: "login" ou "register"
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
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

    if (isAdmin) {
      try {
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
      } catch (err) {
        setLoading(false);
        alert("Erro ao realizar login admin");
        return;
      }
    }

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
        }
      );

      if (!res.ok) {
        setLoading(false);
        alert("Erro ao criar conta. Verifique se o e-mail já está cadastrado.");
        return;
      }

      const success = await loginUser(register.email, register.password);
      setLoading(false);

      if (!success) {
        alert("Conta criada com sucesso! Por favor, faça login.");
        setActiveTab("login");
        return;
      }

      const redirect = params.get("redirect");
      router.push(redirect || "/account");
    } catch {
      setLoading(false);
      alert("Erro inesperado ao criar conta");
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 md:px-6 py-24 md:py-28 overflow-hidden">
      {/* GLOW DE FUNDO */}
      <div className="pointer-events-none absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[var(--gold)] opacity-10 blur-[180px]" />

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
        
        {/* CARD PRINCIPAL INTEGADO */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <p className="uppercase text-[10px] md:text-xs tracking-[0.35em] text-white/40 font-medium">
            Blackstore
          </p>

          <h1 className="mt-3 text-3xl md:text-5xl font-light bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            {isAdmin
              ? "Acesso Restrito"
              : activeTab === "login"
              ? "Bem-vinda de volta"
              : "Criar sua Conta"}
          </h1>

          <p className="mt-3 text-white/60 text-xs md:text-sm leading-relaxed">
            {isAdmin
              ? "Painel de controle do administrador Blackstore."
              : activeTab === "login"
              ? "Entre para acompanhar seus pedidos e acessar novidades em primeira mão."
              : "Cadastre-se em instantes para ter um checkout agilizado e benefícios exclusivos."}
          </p>

          {/* SELETOR DE ABAS INSTANTÂNEO (SEM MODAL / SEM DELAY) */}
          {!isAdmin && (
            <div className="mt-8 flex rounded-full p-1 bg-white/5 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className={`flex-1 py-2.5 text-[10px] md:text-xs uppercase tracking-[0.25em] font-medium rounded-full transition-all duration-300 ${
                  activeTab === "login"
                    ? "bg-[var(--gold)] text-black font-semibold shadow-lg"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className={`flex-1 py-2.5 text-[10px] md:text-xs uppercase tracking-[0.25em] font-medium rounded-full transition-all duration-300 ${
                  activeTab === "register"
                    ? "bg-[var(--gold)] text-black font-semibold shadow-lg"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Criar Conta
              </button>
            </div>
          )}

          {/* FORMULÁRIO DE LOGIN */}
          {activeTab === "login" || isAdmin ? (
            <form
              onSubmit={handleLogin}
              className="mt-6 border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 md:p-8 rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
            >
              <div className="mb-5">
                <label className="text-[10px] uppercase tracking-[0.3em] text-white/50 block mb-2 font-medium">
                  E-mail
                </label>

                <input
                  type="email"
                  required
                  value={login.email}
                  placeholder="seu@email.com"
                  className="w-full bg-black/60 border border-white/10 px-4 py-3.5 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)] transition-colors"
                  onChange={(e) =>
                    setLogin({
                      ...login,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              <div className="mb-2">
                <label className="text-[10px] uppercase tracking-[0.3em] text-white/50 block mb-2 font-medium">
                  Senha
                </label>

                <input
                  type="password"
                  required
                  value={login.password}
                  placeholder="••••••••"
                  className="w-full bg-black/60 border border-white/10 px-4 py-3.5 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)] transition-colors"
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
                className="w-full mt-6 py-4 rounded-full bg-[var(--gold)] text-black text-xs tracking-[0.35em] uppercase font-bold hover:scale-[1.02] hover:shadow-[0_10px_40px_rgba(212,175,55,0.35)] active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
              >
                {loading ? "Processando..." : "Entrar"}
              </button>
            </form>
          ) : (
            /* FORMULÁRIO DE CADASTRO (INSTANTÂNEO) */
            <form
              onSubmit={handleRegister}
              className="mt-6 border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 md:p-8 rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.6)] space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.25em] text-white/50 block mb-1.5 font-medium">
                    Nome
                  </label>
                  <input
                    type="text"
                    required
                    value={register.name}
                    placeholder="Nome"
                    className="w-full bg-black/60 border border-white/10 px-3.5 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)] transition-colors"
                    onChange={(e) =>
                      setRegister({
                        ...register,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.25em] text-white/50 block mb-1.5 font-medium">
                    Sobrenome
                  </label>
                  <input
                    type="text"
                    required
                    value={register.surname}
                    placeholder="Sobrenome"
                    className="w-full bg-black/60 border border-white/10 px-3.5 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)] transition-colors"
                    onChange={(e) =>
                      setRegister({
                        ...register,
                        surname: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-white/50 block mb-1.5 font-medium">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={register.email}
                  placeholder="seu@email.com"
                  className="w-full bg-black/60 border border-white/10 px-3.5 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)] transition-colors"
                  onChange={(e) =>
                    setRegister({
                      ...register,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-white/50 block mb-1.5 font-medium">
                  Telefone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={register.phone}
                  placeholder="(62) 99999-9999"
                  className="w-full bg-black/60 border border-white/10 px-3.5 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)] transition-colors"
                  onChange={(e) =>
                    setRegister({
                      ...register,
                      phone: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-white/50 block mb-1.5 font-medium">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  value={register.password}
                  placeholder="Sua senha secreta"
                  className="w-full bg-black/60 border border-white/10 px-3.5 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)] transition-colors"
                  onChange={(e) =>
                    setRegister({
                      ...register,
                      password: e.target.value,
                    })
                  }
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-4 rounded-full bg-[var(--gold)] text-black text-xs tracking-[0.35em] uppercase font-bold hover:scale-[1.02] hover:shadow-[0_10px_40px_rgba(212,175,55,0.35)] active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
              >
                {loading ? "Criando Conta..." : "Criar Minha Conta"}
              </button>
            </form>
          )}
        </div>

        {/* PAINEL LATERAL INFORMATIVO */}
        <div className="hidden lg:block">
          <div className="border border-white/10 rounded-3xl p-10 md:p-12 bg-gradient-to-br from-white/[0.03] via-[#1a1408]/40 to-transparent backdrop-blur-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gold)] opacity-10 rounded-full blur-2xl" />

            <span className="h-px w-10 bg-[var(--gold)]/60 block mb-4" />

            <h2 className="text-xl uppercase tracking-[0.35em] text-white font-light leading-snug">
              Experiência <br />
              <span className="bs-title font-normal">Blackstore</span>
            </h2>

            <p className="mt-4 text-white/60 text-sm leading-relaxed">
              Sua conta integrada dá acesso instantâneo às nossas melhores coleções e serviços exclusivos.
            </p>

            <ul className="mt-8 space-y-4 text-white/70 text-xs uppercase tracking-widest">
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
                Acesso antecipado a lançamentos
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
                Histórico e rastreio de pedidos
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
                Checkout agilizado
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
                Pagamento seguro via PagBank (Pix / Cartão)
              </li>
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}