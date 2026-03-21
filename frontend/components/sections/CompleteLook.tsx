"use client";

import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ui/ProductCard";

export default function CompleteLook() {
  return (
    <section className="py-24 bg-gradient-to-b from-black to-[#0f0c06]">

      <div className="max-w-7xl mx-auto px-6 md:px-8">

        {/* Título */}
        <div className="mb-16">
          <p className="uppercase text-xs tracking-[0.4em] text-white/50">
            Estilo completo
          </p>

          <h2 className="mt-5 text-4xl md:text-5xl font-light leading-tight">
            <span className="block">Complete o</span>
            <span className="block bs-title">Look Blackstore</span>
          </h2>

          <p className="mt-5 text-white/65 max-w-xl">
            Combine peças selecionadas para criar um visual completo e elegante.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">

          {/* LOOK PRINCIPAL */}
          <div className="lg:col-span-2 relative rounded-3xl overflow-hidden group">

            <div className="relative aspect-[4/5]">

              <Image
                src="/images/product-3.jpg"
                alt="Look completo"
                fill
                className="
                object-cover object-[center_20%]
                transition duration-700
                group-hover:scale-[1.04]
                "
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            </div>

            <div className="absolute bottom-8 left-8">

              <p className="uppercase text-[10px] tracking-[0.4em] text-white/60">
                Look da semana
              </p>

              <h3 className="mt-2 text-xl md:text-2xl font-light">
                Vestido Editorial Black
              </h3>

              <Link
                href="/product/vestido-editorial-black"
                className="
                inline-flex items-center
                mt-5
                px-7 py-3
                rounded-full
                bg-[var(--gold)]
                text-black
                text-[11px]
                tracking-[0.35em]
                uppercase
                hover:scale-105
                hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]
                transition
                "
              >
                Comprar look
              </Link>

            </div>

          </div>

          {/* PRODUTOS COMPLEMENTARES */}
          <div className="space-y-7">

            <ProductCard
              id="look-1"
              image="/images/product-4.jpg"
              name="Bolsa Sculpt Gold"
              price={189.9}
            />

            <ProductCard
              id="look-2"
              image="/images/product-5.jpg"
              name="Sandália Premium Black"
              price={229.9}
            />

          </div>

        </div>

      </div>

    </section>
  );
}