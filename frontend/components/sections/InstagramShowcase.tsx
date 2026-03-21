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

          <h2 className="mt-6 text-4xl md:text-5xl font-light">
            <span className="block">Clientes usando</span>
            <span className="block bs-title">Blackstore</span>
          </h2>

          <p className="mt-6 text-white/60 max-w-xl mx-auto">
            Veja como nossas clientes usam Blackstore no dia a dia.
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

              <div
                className="
                absolute inset-0
                bg-black/40
                opacity-0
                group-hover:opacity-100
                transition
                flex items-center justify-center
                "
              >

                <span className="text-xs uppercase tracking-[0.3em]">
                  Ver look
                </span>

              </div>

            </div>
          ))}

        </div>

        {/* CTA */}
        <div className="mt-16 text-center">

          <a
            href="https://instagram.com/blackstoreloja1"
            target="_blank"
            rel="noopener noreferrer"
            className="
            inline-flex items-center
            px-12 py-4
            rounded-full
            border border-white/20
            text-xs tracking-[0.35em]
            uppercase
            hover:border-[var(--gold)]
            hover:text-[var(--gold)]
            transition
            "
          >
            Seguir no Instagram
          </a>

        </div>

      </div>

    </section>
  );
}