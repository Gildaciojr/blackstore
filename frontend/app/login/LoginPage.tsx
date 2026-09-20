"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";

export default function LoginPage() {
  const params = useSearchParams();
  const router = useRouter();

  const loginUser = useAuth((state) => state.login);
  const syncGuestCart = useCart((state) => state.syncGuestCart);

  const isAdmin = params.get("admin") === "1";

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

  function getCustomerRedirect() {
    const redirect = params.get("redirect");

    /*
     * Aceita somente redirects internos da aplicação.
     *
     * O middleware usa esse parâmetro quando um visitante tenta acessar
     * rotas protegidas, como /checkout.
     */
    if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
      return "/account";
    }

    return redirect;
  }

  async function handleLogin(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);

    /*
     * LOGIN ADMINISTRATIVO
     *
     * Continua totalmente separado do fluxo de cliente.
     * Não sincroniza sacola guest e não interfere no carrinho.
     */
    if (isAdmin) {
      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: login.email,
            password: login.password,
          }),
        });

        if (!response.ok) {
          setLoading(false);
          alert("Credenciais inválidas");
          return;
        }

        setLoading(false);
        router.push("/dashboard");
        return;
      } catch (error) {
        console.error("Erro ao realizar login admin:", error);

        setLoading(false);
        alert("Erro ao realizar login admin");
        return;
      }
    }

    /*
     * LOGIN DO CLIENTE
     */
    const success = await loginUser(login.email, login.password);

    if (!success) {
      setLoading(false);
      alert("Credenciais inválidas");
      return;
    }

    /*
     * A autenticação já foi concluída neste ponto.
     *
     * Agora transferimos para o backend os produtos que o visitante
     * colocou na sacola antes de fazer login.
     */
    try {
      const syncResult = await syncGuestCart();

      setLoading(false);

      if (syncResult.failed > 0) {
        alert(
          `${syncResult.failed} item(ns) da sua sacola não puderam ser sincronizados. Revise a sacola antes de finalizar a compra.`,
        );

        router.push("/cart");
        return;
      }

      router.push(getCustomerRedirect());
    } catch (error) {
      console.error("Erro ao sincronizar sacola após login:", error);

      setLoading(false);

      alert(
        "Sua conta foi acessada, mas não foi possível sincronizar a sacola. Revise sua sacola antes de continuar.",
      );

      router.push("/cart");
    }
  }

  async function handleRegister(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      /*
       * CADASTRO DO CLIENTE
       */
      const response = await fetch(
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

      if (!response.ok) {
        setLoading(false);

        alert("Erro ao criar conta. Verifique se o e-mail já está cadastrado.");

        return;
      }

      /*
       * Após criar a conta fazemos o login automaticamente,
       * preservando o comportamento atual da Blackstore.
       */
      const success = await loginUser(register.email, register.password);

      if (!success) {
        setLoading(false);

        alert("Conta criada com sucesso! Por favor, faça login.");

        setLogin({
          email: register.email,
          password: "",
        });

        setActiveTab("login");
        return;
      }

      /*
       * Conta criada + login concluído.
       *
       * Sincroniza a sacola criada enquanto o cliente ainda
       * navegava anonimamente.
       */
      try {
        const syncResult = await syncGuestCart();

        setLoading(false);

        if (syncResult.failed > 0) {
          alert(
            `${syncResult.failed} item(ns) da sua sacola não puderam ser sincronizados. Revise a sacola antes de finalizar a compra.`,
          );

          router.push("/cart");
          return;
        }

        router.push(getCustomerRedirect());
      } catch (error) {
        console.error("Erro ao sincronizar sacola após cadastro:", error);

        setLoading(false);

        alert(
          "Sua conta foi criada, mas não foi possível sincronizar a sacola. Revise sua sacola antes de continuar.",
        );

        router.push("/cart");
      }
    } catch (error) {
      console.error("Erro inesperado ao criar conta:", error);

      setLoading(false);
      alert("Erro inesperado ao criar conta");
    }
  }

  return (
    <section
      className="
        relative
        w-full
        min-h-[calc(100dvh-6rem)]
        overflow-x-hidden
        px-3
        pt-8
        pb-12
        sm:px-4
        sm:pt-12
        sm:pb-16
        md:px-6
        md:py-16
        lg:min-h-[calc(100dvh-7rem)]
        lg:py-20
      "
    >
      {/* GLOW DE FUNDO */}
      <div
        className="
          pointer-events-none
          absolute
          -top-40
          left-1/2
          h-[30rem]
          w-[30rem]
          -translate-x-1/2
          rounded-full
          bg-[var(--gold)]
          opacity-10
          blur-[140px]
          sm:-top-48
          sm:h-[38rem]
          sm:w-[38rem]
          md:h-[44rem]
          md:w-[44rem]
          md:blur-[180px]
        "
      />

      <div
        className="
          relative
          z-10
          mx-auto
          grid
          w-full
          max-w-6xl
          grid-cols-1
          items-center
          gap-8
          sm:gap-10
          lg:grid-cols-2
          lg:gap-20
        "
      >
        {/* CARD PRINCIPAL */}
        <div className="mx-auto w-full min-w-0 max-w-md lg:mx-0">
          <p
            className="
              text-[9px]
              font-medium
              uppercase
              tracking-[0.28em]
              text-white/40
              sm:text-[10px]
              sm:tracking-[0.35em]
              md:text-xs
            "
          >
            Blackstore
          </p>

          <h1
            className="
              mt-3
              bg-gradient-to-r
              from-white
              to-white/70
              bg-clip-text
              text-2xl
              font-light
              leading-tight
              text-transparent
              min-[360px]:text-3xl
              sm:text-4xl
              md:text-5xl
            "
          >
            {isAdmin
              ? "Acesso Restrito"
              : activeTab === "login"
                ? "Bem-vinda de volta"
                : "Criar sua Conta"}
          </h1>

          <p
            className="
              mt-3
              max-w-md
              text-xs
              leading-relaxed
              text-white/60
              sm:text-sm
            "
          >
            {isAdmin
              ? "Painel de controle do administrador Blackstore."
              : activeTab === "login"
                ? "Entre para acompanhar seus pedidos e acessar novidades em primeira mão."
                : "Cadastre-se em instantes para ter um checkout agilizado e benefícios exclusivos."}
          </p>

          {/* SELETOR DE LOGIN / CADASTRO */}
          {!isAdmin && (
            <div
              className="
                mt-6
                flex
                w-full
                min-w-0
                rounded-full
                border
                border-white/10
                bg-white/5
                p-1
                sm:mt-8
              "
            >
              <button
                type="button"
                disabled={loading}
                onClick={() => setActiveTab("login")}
                className={`
                  min-w-0
                  flex-1
                  rounded-full
                  px-2
                  py-2.5
                  text-[9px]
                  font-medium
                  uppercase
                  tracking-[0.12em]
                  transition-all
                  duration-300
                  sm:px-4
                  sm:text-[10px]
                  sm:tracking-[0.2em]
                  md:text-xs
                  md:tracking-[0.25em]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  ${
                    activeTab === "login"
                      ? "bg-[var(--gold)] text-black font-semibold shadow-lg"
                      : "text-white/60 hover:text-white"
                  }
                `}
              >
                Entrar
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setActiveTab("register")}
                className={`
                  min-w-0
                  flex-1
                  rounded-full
                  px-2
                  py-2.5
                  text-[9px]
                  font-medium
                  uppercase
                  tracking-[0.12em]
                  transition-all
                  duration-300
                  sm:px-4
                  sm:text-[10px]
                  sm:tracking-[0.2em]
                  md:text-xs
                  md:tracking-[0.25em]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  ${
                    activeTab === "register"
                      ? "bg-[var(--gold)] text-black font-semibold shadow-lg"
                      : "text-white/60 hover:text-white"
                  }
                `}
              >
                Criar Conta
              </button>
            </div>
          )}

          {/* FORMULÁRIO DE LOGIN */}
          {activeTab === "login" || isAdmin ? (
            <form
              onSubmit={handleLogin}
              aria-busy={loading}
              className="
                mt-5
                w-full
                min-w-0
                rounded-2xl
                border
                border-white/10
                bg-white/[0.02]
                p-4
                shadow-[0_20px_80px_rgba(0,0,0,0.6)]
                backdrop-blur-xl
                sm:mt-6
                sm:p-6
                md:p-8
              "
            >
              <div className="mb-5 min-w-0">
                <label
                  htmlFor="login-email"
                  className="
                    mb-2
                    block
                    text-[9px]
                    font-medium
                    uppercase
                    tracking-[0.22em]
                    text-white/50
                    sm:text-[10px]
                    sm:tracking-[0.3em]
                  "
                >
                  E-mail
                </label>

                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={login.email}
                  placeholder="seu@email.com"
                  disabled={loading}
                  className="
                    w-full
                    min-w-0
                    rounded-xl
                    border
                    border-white/10
                    bg-black/60
                    px-3.5
                    py-3.5
                    text-sm
                    text-white
                    outline-none
                    transition-colors
                    placeholder:text-white/30
                    focus:border-[var(--gold)]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    sm:px-4
                  "
                  onChange={(event) =>
                    setLogin((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="mb-2 min-w-0">
                <label
                  htmlFor="login-password"
                  className="
                    mb-2
                    block
                    text-[9px]
                    font-medium
                    uppercase
                    tracking-[0.22em]
                    text-white/50
                    sm:text-[10px]
                    sm:tracking-[0.3em]
                  "
                >
                  Senha
                </label>

                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={login.password}
                  placeholder="••••••••"
                  disabled={loading}
                  className="
                    w-full
                    min-w-0
                    rounded-xl
                    border
                    border-white/10
                    bg-black/60
                    px-3.5
                    py-3.5
                    text-sm
                    text-white
                    outline-none
                    transition-colors
                    placeholder:text-white/30
                    focus:border-[var(--gold)]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    sm:px-4
                  "
                  onChange={(event) =>
                    setLogin((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="
                  mt-6
                  w-full
                  rounded-full
                  bg-[var(--gold)]
                  px-3
                  py-4
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.2em]
                  text-black
                  transition-all
                  duration-300
                  hover:scale-[1.02]
                  hover:shadow-[0_10px_40px_rgba(212,175,55,0.35)]
                  active:scale-[0.98]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  disabled:hover:scale-100
                  sm:px-5
                  sm:text-xs
                  sm:tracking-[0.3em]
                  md:tracking-[0.35em]
                "
              >
                {loading
                  ? "Processando..."
                  : isAdmin
                    ? "Entrar no Painel"
                    : "Entrar"}
              </button>
            </form>
          ) : (
            /* FORMULÁRIO DE CADASTRO */
            <form
              onSubmit={handleRegister}
              aria-busy={loading}
              className="
                mt-5
                w-full
                min-w-0
                space-y-4
                rounded-2xl
                border
                border-white/10
                bg-white/[0.02]
                p-4
                shadow-[0_20px_80px_rgba(0,0,0,0.6)]
                backdrop-blur-xl
                sm:mt-6
                sm:p-6
                md:p-8
              "
            >
              <div
                className="
                  grid
                  min-w-0
                  grid-cols-1
                  gap-4
                  sm:grid-cols-2
                  sm:gap-3
                "
              >
                <div className="min-w-0">
                  <label
                    htmlFor="register-name"
                    className="
                      mb-1.5
                      block
                      text-[9px]
                      font-medium
                      uppercase
                      tracking-[0.2em]
                      text-white/50
                      sm:text-[10px]
                      sm:tracking-[0.25em]
                    "
                  >
                    Nome
                  </label>

                  <input
                    id="register-name"
                    type="text"
                    required
                    autoComplete="given-name"
                    value={register.name}
                    placeholder="Nome"
                    disabled={loading}
                    className="
                      w-full
                      min-w-0
                      rounded-xl
                      border
                      border-white/10
                      bg-black/60
                      px-3.5
                      py-3
                      text-sm
                      text-white
                      outline-none
                      transition-colors
                      placeholder:text-white/30
                      focus:border-[var(--gold)]
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                    onChange={(event) =>
                      setRegister((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="register-surname"
                    className="
                      mb-1.5
                      block
                      text-[9px]
                      font-medium
                      uppercase
                      tracking-[0.2em]
                      text-white/50
                      sm:text-[10px]
                      sm:tracking-[0.25em]
                    "
                  >
                    Sobrenome
                  </label>

                  <input
                    id="register-surname"
                    type="text"
                    required
                    autoComplete="family-name"
                    value={register.surname}
                    placeholder="Sobrenome"
                    disabled={loading}
                    className="
                      w-full
                      min-w-0
                      rounded-xl
                      border
                      border-white/10
                      bg-black/60
                      px-3.5
                      py-3
                      text-sm
                      text-white
                      outline-none
                      transition-colors
                      placeholder:text-white/30
                      focus:border-[var(--gold)]
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                    onChange={(event) =>
                      setRegister((current) => ({
                        ...current,
                        surname: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="register-email"
                  className="
                    mb-1.5
                    block
                    text-[9px]
                    font-medium
                    uppercase
                    tracking-[0.2em]
                    text-white/50
                    sm:text-[10px]
                    sm:tracking-[0.25em]
                  "
                >
                  E-mail
                </label>

                <input
                  id="register-email"
                  type="email"
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={register.email}
                  placeholder="seu@email.com"
                  disabled={loading}
                  className="
                    w-full
                    min-w-0
                    rounded-xl
                    border
                    border-white/10
                    bg-black/60
                    px-3.5
                    py-3
                    text-sm
                    text-white
                    outline-none
                    transition-colors
                    placeholder:text-white/30
                    focus:border-[var(--gold)]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                  onChange={(event) =>
                    setRegister((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="register-phone"
                  className="
                    mb-1.5
                    block
                    text-[9px]
                    font-medium
                    uppercase
                    tracking-[0.2em]
                    text-white/50
                    sm:text-[10px]
                    sm:tracking-[0.25em]
                  "
                >
                  Telefone / WhatsApp
                </label>

                <input
                  id="register-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={register.phone}
                  placeholder="(62) 99999-9999"
                  disabled={loading}
                  className="
                    w-full
                    min-w-0
                    rounded-xl
                    border
                    border-white/10
                    bg-black/60
                    px-3.5
                    py-3
                    text-sm
                    text-white
                    outline-none
                    transition-colors
                    placeholder:text-white/30
                    focus:border-[var(--gold)]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                  onChange={(event) =>
                    setRegister((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="register-password"
                  className="
                    mb-1.5
                    block
                    text-[9px]
                    font-medium
                    uppercase
                    tracking-[0.2em]
                    text-white/50
                    sm:text-[10px]
                    sm:tracking-[0.25em]
                  "
                >
                  Senha
                </label>

                <input
                  id="register-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={register.password}
                  placeholder="Mínimo de 6 caracteres"
                  disabled={loading}
                  className="
                    w-full
                    min-w-0
                    rounded-xl
                    border
                    border-white/10
                    bg-black/60
                    px-3.5
                    py-3
                    text-sm
                    text-white
                    outline-none
                    transition-colors
                    placeholder:text-white/30
                    focus:border-[var(--gold)]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                  onChange={(event) =>
                    setRegister((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                />

                <p className="mt-2 text-[10px] leading-relaxed text-white/35">
                  Use pelo menos 6 caracteres.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="
                  mt-6
                  w-full
                  rounded-full
                  bg-[var(--gold)]
                  px-3
                  py-4
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.16em]
                  text-black
                  transition-all
                  duration-300
                  hover:scale-[1.02]
                  hover:shadow-[0_10px_40px_rgba(212,175,55,0.35)]
                  active:scale-[0.98]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  disabled:hover:scale-100
                  sm:px-5
                  sm:text-xs
                  sm:tracking-[0.26em]
                  md:tracking-[0.35em]
                "
              >
                {loading ? "Criando Conta..." : "Criar Minha Conta"}
              </button>
            </form>
          )}
        </div>

        {/* PAINEL LATERAL INFORMATIVO */}
        <div className="hidden min-w-0 lg:block">
          <div
            className="
              relative
              overflow-hidden
              rounded-3xl
              border
              border-white/10
              bg-gradient-to-br
              from-white/[0.03]
              via-[#1a1408]/40
              to-transparent
              p-10
              shadow-2xl
              backdrop-blur-2xl
              xl:p-12
            "
          >
            <div
              className="
                pointer-events-none
                absolute
                right-0
                top-0
                h-32
                w-32
                rounded-full
                bg-[var(--gold)]
                opacity-10
                blur-2xl
              "
            />

            <span className="mb-4 block h-px w-10 bg-[var(--gold)]/60" />

            <h2 className="text-xl font-light uppercase leading-snug tracking-[0.35em] text-white">
              Experiência <br />
              <span className="bs-title font-normal">Blackstore</span>
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Sua conta integrada dá acesso instantâneo às nossas melhores
              coleções e serviços exclusivos.
            </p>

            <ul className="mt-8 space-y-4 text-xs uppercase tracking-widest text-white/70">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                <span>Acesso antecipado a lançamentos</span>
              </li>

              <li className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                <span>Histórico e rastreio de pedidos</span>
              </li>

              <li className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                <span>Checkout agilizado</span>
              </li>

              <li className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                <span>Pagamento seguro via PagBank (Pix / Cartão)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
