"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Hotspot = {
  id: string;
  top: string;
  left: string;
  name: string;
  price: number;
  image: string;
  slug: string;
};

const hotspots: Hotspot[] = [
  {
    id: "look-top",
    top: "30%",
    left: "60%",
    name: "Top Sculpt Black",
    price: 139.9,
    image: "/images/product-4.jpg",
    slug: "top-sculpt-black",
  },
  {
    id: "look-legging",
    top: "55%",
    left: "50%",
    name: "Legging Sculpt Premium",
    price: 179.9,
    image: "/images/product-5.jpg",
    slug: "legging-sculpt-premium",
  },
  {
    id: "look-tenis",
    top: "80%",
    left: "55%",
    name: "Tênis Performance Gold",
    price: 299.9,
    image: "/images/product-3.jpg",
    slug: "tenis-performance-gold",
  },
];

export default function Lookbook() {

  const [active, setActive] = useState<string | null>(null);

  return (
    <section className="py-24 bg-black">

      <div className="max-w-7xl mx-auto px-6 md:px-8">

        <div className="mb-16">
          <p className="uppercase text-xs tracking-[0.4em] text-white/50">
            Editorial
          </p>

          <h2 className="mt-5 text-4xl md:text-5xl font-light leading-tight">
            <span className="block">Explore o</span>
            <span className="block bs-title">Lookbook Blackstore</span>
          </h2>
        </div>

        <div className="relative w-full max-w-3xl mx-auto">

          {/* imagem editorial */}
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden">

            <Image
              src="/images/product-3.jpg"
              alt="Lookbook"
              fill
              className="
              object-cover object-[center_20%]
              transition duration-700
              hover:scale-[1.03]
              "
            />

          </div>

          {/* HOTSPOTS */}
          {hotspots.map((spot) => (
            <div
              key={spot.id}
              className="absolute"
              style={{
                top: spot.top,
                left: spot.left,
                transform: "translate(-50%, -50%)",
              }}
            >
              <button
                onClick={() =>
                  setActive(active === spot.id ? null : spot.id)
                }
                className="
                  w-5 h-5 rounded-full
                  bg-[var(--gold)]
                  border border-white
                  shadow-lg
                  animate-pulse
                "
              />

              {active === spot.id && (
                <div
                  className="
                    absolute mt-4 w-52
                    bg-[#0f0f12]
                    border border-white/10
                    rounded-xl
                    p-4
                    shadow-2xl
                    backdrop-blur
                  "
                >
                  <p className="text-sm font-medium">
                    {spot.name}
                  </p>

                  <p className="mt-2 text-[var(--gold)] text-sm">
                    R$ {spot.price}
                  </p>

                  <Link
                    href={`/product/${spot.slug}`}
                    className="
                      inline-block mt-3 text-[11px]
                      uppercase tracking-widest
                      text-white/60 hover:text-white
                      transition
                    "
                  >
                    Ver produto →
                  </Link>
                </div>
              )}

            </div>
          ))}

        </div>

      </div>

    </section>
  );
}