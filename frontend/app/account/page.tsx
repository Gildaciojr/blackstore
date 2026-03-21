"use client";

import Link from "next/link";

export default function AccountPage() {
  return (
    <section className="max-w-6xl mx-auto px-8 pt-40 pb-32">

      <h1 className="text-4xl md:text-5xl tracking-widest uppercase bs-title mb-16">
        Minha Conta
      </h1>

      <div className="grid md:grid-cols-2 gap-10">

        <Link
          href="/account/orders"
          className="border border-white/10 p-10 hover:border-[var(--gold)] transition"
        >
          <h2 className="uppercase tracking-[0.35em] text-sm mb-4">
            Pedidos
          </h2>

          <p className="text-white/60 text-sm">
            Veja o histórico completo dos seus pedidos.
          </p>
        </Link>

        <Link
          href="/catalog"
          className="border border-white/10 p-10 hover:border-[var(--gold)] transition"
        >
          <h2 className="uppercase tracking-[0.35em] text-sm mb-4">
            Continuar comprando
          </h2>

          <p className="text-white/60 text-sm">
            Explore novas peças da coleção Blackstore.
          </p>
        </Link>

      </div>

    </section>
  );
}