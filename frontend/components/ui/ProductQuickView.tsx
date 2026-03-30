"use client";

import Image from "next/image";
import { X, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/store/cart";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/api";

type Variant = {
  id: string;
  size: string;
  stock: number;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  oldPrice?: number;
  variants?: Variant[];
};

type Props = {
  product: Product;
  onClose: () => void;
};

function resolveImage(url: string) {
  if (!url) return "";

  if (url.startsWith("http")) return url;
  if (url.startsWith("/images")) return url;

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${API_URL}${normalizedPath}`;
}

export default function ProductQuickView({ product, onClose }: Props) {
  const addItem = useCart((s) => s.addItem);

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [currentProductId, setCurrentProductId] = useState(product.id);

  if (currentProductId !== product.id) {
    setCurrentProductId(product.id);
    setSelectedVariant(null);
  }

  const hasVariants =
    Array.isArray(product.variants) && product.variants.length > 0;

  const [index, setIndex] = useState(0);

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

  function handleAddToCart() {
    if (hasVariants) {
      if (!selectedVariant) return;
      if (selectedVariant.stock <= 0) return;

      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: currentImage,
        variantId: selectedVariant.id,
        size: selectedVariant.size,
      });

      onClose();
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: currentImage,
    });

    onClose();
  }

  /**
   * 🔥 BLOQUEIO DE SCROLL DO FUNDO (PERFORMANCE + UX)
   */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="
          fixed inset-0 z-[100]
          flex items-end md:items-center justify-center
          px-0 md:px-6
        "
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
          drag="y"
          dragConstraints={{ top: 0, bottom: 200 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.y > 120) {
              onClose();
            }
          }}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="
            relative z-10 w-full max-w-5xl
            h-[92vh] md:h-auto
            bg-[#0b0b0d]/95 backdrop-blur-xl
            border border-white/10
            rounded-t-2xl md:rounded-2xl
            grid grid-cols-1 md:grid-cols-2
            overflow-hidden
            will-change-transform
          "
        >
          {/* HANDLE (UX mobile) */}
          <div className="md:hidden flex justify-center py-3">
            <div className="w-10 h-1.5 rounded-full bg-white/20" />
          </div>

          {/* CLOSE */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 z-20 text-white/60 hover:text-white transition"
          >
            <X size={22} />
          </button>

          {/* GALERIA */}
          <div className="relative flex min-h-[280px] flex-col bg-black">
            <div className="relative aspect-[3/4] md:flex-1 overflow-hidden">
              <Image
                key={currentImage}
                src={currentImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              {images.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur border border-white/20 flex items-center justify-center text-white"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    onClick={next}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur border border-white/20 flex items-center justify-center text-white"
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
                    className={`relative aspect-square rounded-lg overflow-hidden border ${
                      index === i
                        ? "border-[var(--gold)] scale-105"
                        : "border-white/10"
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover object-center md:object-center" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CONTEÚDO */}
          <div className="p-6 md:p-10 flex flex-col overflow-y-auto overscroll-contain">
            <p className="uppercase text-[10px] tracking-[0.45em] text-white/40">
              Blackstore
            </p>

            <h2 className="mt-3 text-xl md:text-3xl font-light leading-tight">
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

              <span className="text-xl md:text-3xl font-semibold text-[var(--gold)]">
                R$ {product.price.toLocaleString("pt-BR")}
              </span>
            </div>

            {hasVariants && (
              <div className="mt-8">
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/50 mb-4">
                  Tamanho
                </p>

                <div className="flex gap-3 flex-wrap">
                  {product.variants!.map((v) => {
                    const disabled = v.stock <= 0;

                    return (
                      <button
                        key={v.id}
                        disabled={disabled}
                        onClick={() => setSelectedVariant(v)}
                        className={`w-10 h-10 rounded-full border text-sm flex items-center justify-center transition ${
                          selectedVariant?.id === v.id
                            ? "bg-[var(--gold)] text-black border-[var(--gold)]"
                            : "border-white/20 text-white hover:border-white"
                        } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
                      >
                        {v.size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {hasVariants && !selectedVariant && (
              <p className="text-xs text-red-400 mt-4">
                Selecione um tamanho
              </p>
            )}

            <div className="mt-10 flex gap-4 flex-col sm:flex-row">
              <button
                onClick={handleAddToCart}
                disabled={
                  hasVariants
                    ? !selectedVariant || selectedVariant.stock <= 0
                    : false
                }
                className="
                  flex-1 inline-flex items-center justify-center gap-3
                  px-10 py-4 rounded-full
                  bg-[var(--gold)] text-black
                  text-xs uppercase tracking-[0.35em]
                  shadow-[0_10px_30px_rgba(212,175,55,0.25)]
                  hover:scale-105 transition
                  disabled:opacity-40 disabled:cursor-not-allowed
                "
              >
                <ShoppingBag size={18} />
                Adicionar
              </button>

              <button
                onClick={onClose}
                className="
                  flex-1 px-10 py-4 rounded-full
                  border border-white/20
                  text-xs uppercase tracking-[0.35em]
                  hover:border-white transition
                "
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