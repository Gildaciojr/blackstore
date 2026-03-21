"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/store/cart";
import { useRef, useState } from "react";

type Props = {
  id: string;
  slug?: string;
  image: string;
  images?: string[]; // 🔥 NOVO
  name: string;
  price: number;
  oldPrice?: number;
  badge?: string;
  highlight?: boolean;
  onQuickView?: () => void;
};

function brl(v: number) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProductCard({
  id,
  slug,
  image,
  images,
  name,
  price,
  oldPrice,
  badge,
  highlight,
  onQuickView,
}: Props) {

  const addItem = useCart((s) => s.addItem);
  const cardRef = useRef<HTMLDivElement>(null);

  const [imgIndex, setImgIndex] = useState(0);

 const imgs = [
  image,
  ...(images && images.length > 0 ? images : []),
];

  const discount =
    oldPrice && oldPrice > price
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : null;

  const productUrl = slug ? `/product/${slug}` : "#";

  function handleMove(e: React.MouseEvent) {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty("--x", `${x}px`);
    card.style.setProperty("--y", `${y}px`);
  }

  function nextImage(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((prev) => (prev + 1) % imgs.length);
  }

  function prevImage(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((prev) => (prev - 1 + imgs.length) % imgs.length);
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMove}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02}}
      transition={{ duration: 0.4 }}
      viewport={{ once: true }}
      className="group relative"
    >

      {/* CARD */}
      <div className="relative overflow-hidden rounded-2xl">

        {/* IMAGE */}
        <Link href={productUrl}>
          <div className="relative aspect-[4/5] bg-black overflow-hidden">

            <motion.div
              key={imgIndex}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              <Image
                src={imgs[imgIndex]}
                alt={name}
                fill
                sizes="(max-width:768px) 50vw, 20vw"
                className="
                  object-cover
                  transition-transform duration-700
                  group-hover:scale-[1.08]
                "
              />
            </motion.div>

            {/* GRADIENT */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.12),transparent_60%)]" />

          </div>
        </Link>

        {/* SETAS (slider) */}
        {imgs.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="
                absolute left-2 top-1/2 -translate-y-1/2 z-20
                w-8 h-8 rounded-full
                bg-black/60 backdrop-blur
                border border-white/20
                flex items-center justify-center
                text-white
                opacity-0 group-hover:opacity-100
                transition
              "
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={nextImage}
              className="
                absolute right-2 top-1/2 -translate-y-1/2 z-20
                w-8 h-8 rounded-full
                bg-black/60 backdrop-blur
                border border-white/20
                flex items-center justify-center
                text-white
                opacity-0 group-hover:opacity-100
                transition
              "
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* BADGES */}
        {(badge || discount) && (
          <div className="absolute top-3 left-3 flex gap-2 z-20">

            {badge && (
              <span className="px-2 py-1 text-[9px] uppercase tracking-[0.3em] bg-white/10 border border-white/20 rounded-full">
                {badge}
              </span>
            )}

            {discount && (
              <span className="px-2 py-1 text-[9px] uppercase tracking-[0.3em] bg-[var(--gold)] text-black rounded-full">
                {discount}% OFF
              </span>
            )}

          </div>
        )}

        {/* QUICK VIEW */}
        {onQuickView && (
          <div className="
            absolute top-3 right-3 z-20
            opacity-0 group-hover:opacity-100
            transition duration-300
          ">
            <button
              onClick={onQuickView}
              className="
                w-10 h-10 rounded-full
                bg-black/60 backdrop-blur
                border border-white/20
                flex items-center justify-center
                text-white
                hover:bg-[var(--gold)]
                hover:text-black
                transition
              "
            >
              <Eye size={18} />
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="
          absolute inset-0 flex items-end justify-center
          opacity-0 group-hover:opacity-100
          transition duration-300
          pointer-events-none group-hover:pointer-events-auto
        ">
          <div className="w-full p-4">

            <button
              onClick={() =>
                addItem({ id, name, price, oldPrice, image })
              }
              className="
                w-full py-3 rounded-full
                bg-[var(--gold)] text-black
                text-[10px] uppercase tracking-[0.35em]
                flex items-center justify-center gap-2
                hover:scale-105 active:scale-[0.98]
                transition-all duration-300
              "
            >
              <ShoppingBag size={16} />
              Adicionar
            </button>

          </div>
        </div>

      </div>

      {/* CONTENT */}
      <div className="mt-4 px-1">

        <p className="text-[9px] uppercase tracking-[0.35em] text-white/40">
          Blackstore
        </p>

        <Link href={productUrl}>
          <h3 className="
            mt-1 text-xs md:text-sm
            tracking-widest uppercase
            text-white
            line-clamp-2
            group-hover:text-[var(--gold)]
            transition
          ">
            {name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center gap-2">

          {oldPrice && oldPrice > price && (
            <p className="text-[10px] text-white/40 line-through">
              {brl(oldPrice)}
            </p>
          )}

          <p className="text-sm md:text-base font-medium text-[var(--gold)]">
            {brl(price)}
          </p>

        </div>

      </div>

    </motion.div>
  );
}