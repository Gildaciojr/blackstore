"use client";

import Image from "next/image";
import { X, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/store/cart";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/api";

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  oldPrice?: number;
};

type Props = {
  product: Product;
  onClose: () => void;
};

/**
 * 🔥 PADRÃO GLOBAL (MESMO DO ProductCard)
 */
function resolveImage(url: string) {
  if (!url) return "";

  if (url.startsWith("http")) return url;
  if (url.startsWith("/images")) return url;

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${API_URL}${normalizedPath}`;
}

export default function ProductQuickView({ product, onClose }: Props) {
  const addItem = useCart((s) => s.addItem);

  const [size, setSize] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const sizes = ["PP", "P", "M", "G", "GG"];

  /**
   * 🔥 CORREÇÃO AQUI
   */
  const images = [
    resolveImage(product.image),
    ...(product.images?.map((img) => resolveImage(img)) ?? []),
  ].filter((img, i, arr) => Boolean(img) && arr.indexOf(img) === i);

  const currentImage =
    images[index] ?? images[0] ?? resolveImage(product.image);

  function next() {
    if (images.length <= 1) return;
    setIndex((prev) => (prev + 1) % images.length);
  }

  function prev() {
    if (images.length <= 1) return;
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 md:px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* BACKDROP */}
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* MODAL */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="
            relative z-10 w-full max-w-5xl
            bg-[#0b0b0d]/95 backdrop-blur-xl
            border border-white/10
            rounded-2xl
            grid grid-cols-1 md:grid-cols-2
            overflow-hidden
            max-h-[90vh]
          "
        >
          {/* CLOSE */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 z-20 text-white/60 hover:text-white transition"
          >
            <X size={22} />
          </button>

          {/* ================= GALERIA ================= */}
          <div className="relative flex min-h-[320px] flex-col bg-black">
            <div className="relative aspect-[3/4] md:flex-1 overflow-hidden">
              <Image
                key={currentImage}
                src={currentImage}
                alt={product.name}
                fill
                className="object-cover transition duration-700 hover:scale-[1.04]"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              {images.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:border-white/40 transition"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    onClick={next}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:border-white/40 transition"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 p-3 bg-black/40">
                {images.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    onClick={() => setIndex(i)}
                    className={`relative aspect-square rounded-lg overflow-hidden border transition ${
                      index === i
                        ? "border-[var(--gold)] scale-105"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <Image
                      src={img}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="25vw"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ================= CONTEÚDO ================= */}
          <div className="p-8 md:p-10 flex flex-col justify-center overflow-y-auto">
            <p className="uppercase text-[10px] tracking-[0.45em] text-white/40">
              Blackstore
            </p>

            <h2 className="mt-3 text-2xl md:text-3xl font-light leading-tight">
              {product.name}
            </h2>

            <p className="mt-4 text-white/60 text-sm leading-relaxed">
              Peça premium da coleção Blackstore desenvolvida para mulheres que
              valorizam presença e autenticidade.
            </p>

            <div className="mt-6 flex items-center gap-4">
              {product.oldPrice && (
                <span className="text-white/40 line-through">
                  R$ {product.oldPrice.toLocaleString("pt-BR")}
                </span>
              )}

              <span className="text-2xl md:text-3xl font-semibold text-[var(--gold)]">
                R$ {product.price.toLocaleString("pt-BR")}
              </span>
            </div>

            <div className="mt-8">
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/50 mb-4">
                Tamanho
              </p>

              <div className="flex gap-3 flex-wrap">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`w-10 h-10 rounded-full border text-sm flex items-center justify-center transition ${
                      size === s
                        ? "bg-[var(--gold)] text-black border-[var(--gold)]"
                        : "border-white/20 text-white hover:border-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 flex gap-4 flex-col sm:flex-row">
              <button
                onClick={() =>
                  addItem({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: currentImage,
                  })
                }
                className="flex-1 inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full bg-[var(--gold)] text-black text-xs uppercase tracking-[0.35em] shadow-[0_10px_30px_rgba(212,175,55,0.25)] hover:scale-105 transition"
              >
                <ShoppingBag size={18} />
                Adicionar
              </button>

              <button
                onClick={onClose}
                className="flex-1 px-10 py-4 rounded-full border border-white/20 text-xs uppercase tracking-[0.35em] hover:border-white transition"
              >
                Continuar
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
