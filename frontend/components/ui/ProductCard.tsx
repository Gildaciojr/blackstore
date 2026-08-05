"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/store/cart";
import { useRef, useState } from "react";
import { API_URL } from "@/lib/api";

type Variant = {
  id: string;
  size: string;
  stock: number;
};

type Props = {
  id: string;
  slug?: string;
  image: string;
  images?: string[];
  name: string;
  price: number;
  oldPrice?: number;
  badge?: string;
  highlight?: boolean;
  stock?: number;
  variants?: Variant[];
  onQuickView?: () => void;
};

function brl(v: number) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function resolveImage(url: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/images")) return url;
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${API_URL}${normalizedPath}`;
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
  stock,
  variants,
  onQuickView,
}: Props) {
  const addItem = useCart((s) => s.addItem);
  const cardRef = useRef<HTMLDivElement>(null);
  const [imgIndex, setImgIndex] = useState(0);

  const imgs = [
    resolveImage(image),
    ...(images && images.length > 0
      ? images.map((img) => resolveImage(img))
      : []),
  ].filter((img, index, arr) => Boolean(img) && arr.indexOf(img) === index);

  const discount =
    oldPrice && oldPrice > price
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : null;

  const productUrl = slug ? `/product/${slug}` : "#";
  const frameRef = useRef<number | null>(null);

  function handleMove(e: React.MouseEvent) {
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    if (frameRef.current) return;

    frameRef.current = requestAnimationFrame(() => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty("--x", `${x}px`);
      card.style.setProperty("--y", `${y}px`);

      frameRef.current = null;
    });
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

  const hasVariants = Array.isArray(variants) && variants.length > 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (hasVariants) {
      if (onQuickView) {
        onQuickView();
        return;
      }
      if (slug) {
        window.location.href = `/product/${slug}`;
        return;
      }
      return;
    }

    addItem({
      id,
      name,
      price,
      oldPrice,
      image,
    });
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={(e) => {
        if (typeof window !== "undefined" && window.innerWidth >= 768) {
          handleMove(e);
        }
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -4,
        scale: typeof window !== "undefined" && window.innerWidth >= 768 ? 1.02 : 1,
      }}
      transition={{ duration: 0.4 }}
      viewport={{ once: true }}
      className="group relative flex flex-col h-full bg-transparent"
    >
      {/* CARD CONTAINER */}
      <div
        className="relative overflow-hidden rounded-2xl
                    bg-white/[0.02] border border-white/10
                    transition-all duration-500
                    group-hover:border-[var(--gold)]/30
                    group-hover:shadow-[0_10px_40px_rgba(212,175,55,0.15)]"
      >
        {/* GLOW EFFECT */}
        <div
          className="pointer-events-none absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition duration-700"
          style={{
            background:
              "radial-gradient(circle at var(--x) var(--y), rgba(212,175,55,0.15), transparent 60%)",
          }}
        />

        {/* IMAGE AREA */}
        {onQuickView ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView();
            }}
            className="block w-full text-left"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <motion.div
                key={imgIndex}
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Image
                  src={imgs[imgIndex] || "/images/placeholder.jpg"}
                  alt={name}
                  fill
                  sizes="(max-width:768px) 80vw, (max-width:1200px) 30vw, 20vw"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="object-cover object-center transition-transform duration-[1000ms] ease-out group-hover:scale-105"
                />
              </motion.div>
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition duration-500" />
            </div>
          </button>
        ) : (
          <Link href={productUrl} className="block w-full">
            <div className="relative aspect-[4/5] overflow-hidden">
              <motion.div
                key={imgIndex}
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Image
                  src={imgs[imgIndex] || "/images/placeholder.jpg"}
                  alt={name}
                  fill
                  sizes="(max-width:768px) 80vw, (max-width:1200px) 30vw, 20vw"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="object-cover object-center transition-transform duration-[1000ms] ease-out group-hover:scale-105"
                />
              </motion.div>
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition duration-500" />
            </div>
          </Link>
        )}

        {/* LOW STOCK BADGE */}
        {stock !== undefined && stock <= 2 && stock > 0 && (
          <div className="absolute bottom-3 left-3 z-30 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] rounded-full border border-orange-400/30 bg-orange-500/20 text-orange-300 backdrop-blur-md whitespace-nowrap shadow-lg font-bold">
              🔥 Últimas unidades
            </span>
          </div>
        )}

        {/* SETAS DE NAVEGAÇÃO DE IMAGENS */}
        {imgs.length > 1 && (
          <>
            <button
              onClick={prevImage}
              aria-label="Imagem anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={nextImage}
              aria-label="Próxima imagem"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* 🔥 BADGES REDESENHADAS: Empilhamento vertical ultracompacto que NÃO cobre o rosto das modelos */}
        {(badge || discount) && (
          <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1 z-20 pointer-events-none">
            {discount && (
              <span className="px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] bg-[var(--gold)] text-black rounded-full font-bold shadow-md whitespace-nowrap">
                {discount}% OFF
              </span>
            )}
            {badge && (
              <span className="px-2 py-0.5 text-[8px] uppercase tracking-[0.2em] bg-black/60 text-white/90 border border-white/20 rounded-full font-medium backdrop-blur-md whitespace-nowrap">
                {badge}
              </span>
            )}
          </div>
        )}

        {/* QUICK VIEW BUTTON */}
        {onQuickView && (
          <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView();
              }}
              aria-label="Visualização rápida"
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-[var(--gold)] hover:text-black transition-colors shadow-lg"
            >
              <Eye size={16} />
            </button>
          </div>
        )}

        {/* BOTTOM CTA HOVER */}
        <div className="absolute inset-x-0 bottom-0 p-3 z-20 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={handleAddToCart}
            className="w-full py-3 rounded-full bg-[var(--gold)] text-black text-[10px] uppercase tracking-[0.3em] font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] shadow-xl transition-all duration-300"
          >
            <ShoppingBag size={14} />
            {hasVariants ? "Ver opções" : "Comprar"}
          </button>
        </div>
      </div>

      {/* PRODUCT INFO / DETAILS */}
      <div className="mt-3.5 px-1 flex flex-col flex-grow bg-transparent">
        <p className="text-[9px] uppercase tracking-[0.35em] text-white/40 font-medium">
          Blackstore
        </p>

        <Link href={productUrl} className="mt-1.5 flex-grow">
          <h3 className="text-xs md:text-sm tracking-wider uppercase text-white/90 line-clamp-2 group-hover:text-[var(--gold)] transition-colors">
            {name}
          </h3>
        </Link>

        <div className="mt-2.5 flex items-center gap-2.5">
          {oldPrice && oldPrice > price && (
            <p className="text-[11px] text-white/40 line-through">
              {brl(oldPrice)}
            </p>
          )}

          <p className="text-sm md:text-base font-semibold text-[var(--gold)]">
            {brl(price)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}