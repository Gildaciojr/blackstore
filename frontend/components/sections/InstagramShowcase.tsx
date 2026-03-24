"use client";

import Image from "next/image";

const posts = [
  { id: 1, image: "/images/product-3.jpg" },
  { id: 2, image: "/images/product-4.jpg" },
  { id: 3, image: "/images/product-5.jpg" },
  { id: 4, image: "/images/product-3.jpg" },
  { id: 5, image: "/images/product-4.jpg" },
  { id: 6, image: "/images/product-5.jpg" },
];

export default function InstagramShowcase() {
  return (
    <section className="py-28 bg-black">

      <div className="max-w-7xl mx-auto px-6 md:px-8">

        {/* HEADER */}
        <div className="mb-20 text-center">

          <p className="uppercase text-xs tracking-[0.4em] text-white/50">
            Comunidade
          </p>

          <h2 className="mt-6 text-4xl md:text-5xl font-light leading-tight">
            <span className="block">Quem veste Blackstore,</span>
            <span className="block bs-title">vive o estilo</span>
          </h2>

          <p className="mt-6 text-white/60 max-w-xl mx-auto leading-relaxed">
            Junte-se à nossa comunidade e mostre seu look.
            Marque <span className="text-white">@blackstoreloja1</span> e apareça aqui.
          </p>

        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">

          {posts.map((post) => (
            <div
              key={post.id}
              className="
                relative
                aspect-square
                overflow-hidden
                rounded-xl
                group
              "
            >

              <Image
                src={post.image}
                alt="Cliente Blackstore"
                fill
                className="
                  object-cover
                  transition
                  duration-700
                  group-hover:scale-110
                "
              />

              {/* OVERLAY */}
              <div
                className="
                  absolute inset-0
                  bg-black/50
                  opacity-0
                  group-hover:opacity-100
                  transition
                  flex flex-col items-center justify-center
                  gap-2
                "
              >

                <span className="text-[10px] tracking-[0.3em] uppercase text-white/60">
                  @cliente
                </span>

                <span className="text-xs uppercase tracking-[0.35em] text-white">
                  Ver look
                </span>

                <span className="text-[10px] text-white/50">
                  Inspire-se
                </span>

              </div>

            </div>
          ))}

        </div>

        {/* CTA */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">

          <a
            href="https://instagram.com/blackstoreloja1"
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center justify-center
              px-10 py-4
              rounded-full
              border border-white/20
              text-xs tracking-[0.35em]
              uppercase
              text-white/80
              hover:border-[var(--gold)]
              hover:text-[var(--gold)]
              transition-all duration-300
            "
          >
            Marcar no Instagram
          </a>

          <a
            href="https://wa.me/5562994694804"
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center justify-center
              px-10 py-4
              rounded-full
              bg-[var(--gold)]
              text-black
              text-xs tracking-[0.35em]
              uppercase
              font-medium
              hover:scale-[1.04]
              active:scale-[0.98]
              transition-all duration-300
            "
          >
            Montar meu look
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