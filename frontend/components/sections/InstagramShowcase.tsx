"use client";

import Image from "next/image";
import { Instagram, ArrowRight } from "lucide-react";

const posts = [
  { id: 1, image: "/images/product-3.jpg", handle: "@cliente.um" },
  { id: 2, image: "/images/product-4.jpg", handle: "@cliente.dois" },
  { id: 3, image: "/images/product-5.jpg", handle: "@cliente.tres" },
  { id: 4, image: "/images/product-3.jpg", handle: "@cliente.quatro" },
  { id: 5, image: "/images/product-4.jpg", handle: "@cliente.cinco" },
  { id: 6, image: "/images/product-5.jpg", handle: "@cliente.seis" },
];

export default function InstagramShowcase() {
  return (
    <section className="py-24 md:py-32 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-8">

        {/* HEADER */}
        <div className="mb-16 md:mb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
            <Instagram size={14} className="text-[var(--gold)]" />
            <span className="uppercase text-[10px] md:text-xs tracking-[0.4em] text-white/80 font-medium">
              Comunidade
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light leading-tight">
            <span className="block text-white">Quem veste Blackstore,</span>
            <span className="block bs-title mt-1">vive o estilo</span>
          </h2>

          <p className="mt-6 text-white/60 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            Junte-se à nossa comunidade e mostre seu look.
            Marque <span className="text-white font-medium">@blackstoreloja1</span> e apareça aqui.
          </p>
        </div>

        {/* GRID DE POSTS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {posts.map((post) => (
            <a
              key={post.id}
              href="https://instagram.com/blackstoreloja1"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ver post de ${post.handle} no Instagram`}
              className="
                relative
                aspect-square
                overflow-hidden
                rounded-2xl
                bg-neutral-900
                group
                block
                border border-white/5
                hover:border-[var(--gold)]/40
                transition-all duration-500
              "
            >
              <Image
                src={post.image}
                alt="Look de cliente Blackstore"
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                className="
                  object-cover
                  transition-transform
                  duration-700
                  ease-out
                  group-hover:scale-110
                "
              />

              {/* OVERLAY COM GRADIENTE SUAVE */}
              <div
                className="
                  absolute inset-0
                  bg-gradient-to-t from-black/80 via-black/40 to-transparent
                  opacity-0
                  group-hover:opacity-100
                  transition-opacity
                  duration-300
                  flex flex-col items-center justify-end
                  p-4 text-center
                "
              >
                <Instagram size={20} className="text-[var(--gold)] mb-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300" />
                <span className="text-[10px] tracking-[0.25em] uppercase text-white/70 font-medium">
                  {post.handle}
                </span>
                <span className="text-xs uppercase tracking-[0.3em] text-white font-semibold mt-1">
                  Ver look
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* CTAS / BOTÕES */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <a
            href="https://instagram.com/blackstoreloja1"
            target="_blank"
            rel="noopener noreferrer"
            className="
              w-full sm:w-auto
              inline-flex items-center justify-center gap-3
              px-8 md:px-10 py-4
              rounded-full
              border border-white/20
              text-xs tracking-[0.35em]
              uppercase font-medium
              text-white/90
              hover:border-[var(--gold)]
              hover:text-[var(--gold)]
              transition-all duration-300
            "
          >
            <Instagram size={16} />
            Marcar no Instagram
          </a>

          <a
            href="https://wa.me/5562994694804"
            target="_blank"
            rel="noopener noreferrer"
            className="
              w-full sm:w-auto
              inline-flex items-center justify-center gap-3
              px-8 md:px-10 py-4
              rounded-full
              bg-[var(--gold)]
              text-black
              text-xs tracking-[0.35em]
              uppercase
              font-semibold
              hover:scale-[1.03]
              active:scale-[0.98]
              shadow-[0_0_20px_rgba(212,175,55,0.4)]
              transition-all duration-300
            "
          >
            Montar meu look
            <ArrowRight size={16} />
          </a>
        </div>

        {/* MICRO COPY FINAL */}
        <p className="mt-8 text-center text-white/40 text-xs tracking-wider">
          Inspire-se em quem já vive o estilo Blackstore.
        </p>

      </div>
    </section>
  );
}