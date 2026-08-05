"use client";

import Image from "next/image";
import { X, ShoppingBag, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
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
  description?: string;
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
  const [index, setIndex] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  const [productStateId, setProductStateId] = useState(product.id);

  if (productStateId !== product.id) {
    setProductStateId(product.id);
    setSelectedVariant(null);
    setIndex(0);
    setIsSuccess(false);
  }

  const hasVariants =
    Array.isArray(product.variants) && product.variants.length > 0;

  const images = useMemo(() => {
    return [
      resolveImage(product.image),
      ...(product.images?.map((img) => resolveImage(img)) ?? []),
    ].filter((img, i, arr) => Boolean(img) && arr.indexOf(img) === i);
  }, [product.image, product.images]);

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
    } else {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: currentImage,
      });
    }

    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  }

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end md:items-center justify-center px-0 md:px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
      >
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity"
        />

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          className="
            relative z-10 w-full max-w-5xl
            h-[92vh] md:h-auto max-h-[85vh]
            bg-[#0b0b0d]/95 backdrop-blur-3xl
            border border-white/10
            rounded-t-3xl md:rounded-2xl
            flex flex-col md:grid md:grid-cols-2
            overflow-hidden shadow-2xl
            will-change-transform
          "
        >
          {/* HANDLE MOBILE PARA ARRASTAR */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 120 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
            className="md:hidden flex justify-center py-3 cursor-grab active:cursor-grabbing"
          >
            <div className="w-12 h-1.5 rounded-full bg-white/20" />
          </motion.div>

          <button
            onClick={onClose}
            aria-label="Fechar visualização rápida"
            className="absolute right-5 top-5 z-20 w-9 h-9 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:border-white/30 transition-all"
          >
            <X size={18} />
          </button>

          {/* GALERIA DE IMAGENS - AJUSTADA PARA MOBILE */}
          <div className="relative flex min-h-[350px] md:min-h-[450px] flex-col bg-[#0b0b0d]">
            <div className="relative w-full h-full md:aspect-[4/5] bg-transparent overflow-hidden flex items-center justify-center">
              <motion.div
                key={currentImage}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <Image
                  src={currentImage}
                  alt={product.name}
                  fill
                  className="object-contain md:object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </motion.div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none md:hidden" />

              {images.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    aria-label="Imagem anterior"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    onClick={next}
                    aria-label="Próxima imagem"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* CONTEÚDO E DETALHES */}
          <div className="p-6 md:p-10 flex flex-col overflow-y-auto overscroll-y-contain">
            <p className="uppercase text-[10px] tracking-[0.45em] text-white/40 font-medium">
              Blackstore
            </p>

            <h2 className="mt-2 text-xl md:text-3xl font-light text-white tracking-wide">
              {product.name}
            </h2>

            {product.description ? (
              <p className="mt-4 text-white/60 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            ) : (
              <p className="mt-4 text-white/40 text-xs italic">
                Este produto não possui descrição cadastrada.
              </p>
            )}

            <div className="mt-6 flex items-center gap-4">
              {product.oldPrice && product.oldPrice > product.price && (
                <span className="text-white/40 text-sm line-through">
                  R$ {product.oldPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              )}

              <span className="text-xl md:text-2xl font-semibold text-[var(--gold)]">
                R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {hasVariants && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-white/60 font-medium">
                    Selecione o Tamanho
                  </p>
                  {hasVariants && !selectedVariant && (
                    <span className="text-[11px] text-amber-400/90 tracking-wide">
                      Obrigatório
                    </span>
                  )}
                </div>

                <div className="flex gap-3 flex-wrap">
                  {product.variants!.map((v) => {
                    const disabled = v.stock <= 0;
                    const isSelected = selectedVariant?.id === v.id;

                    return (
                      <button
                        key={v.id}
                        disabled={disabled}
                        onClick={() => setSelectedVariant(v)}
                        aria-label={`Tamanho ${v.size}`}
                        className={`
                          w-11 h-11 rounded-full border text-xs font-semibold flex items-center justify-center transition-all duration-300
                          ${
                            isSelected
                              ? "bg-[var(--gold)] text-black border-[var(--gold)] shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-105"
                              : "border-white/20 text-white hover:border-white/60 bg-white/5"
                          }
                          ${disabled ? "opacity-20 cursor-not-allowed border-dashed" : ""}
                        `}
                      >
                        {v.size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-white/10 flex gap-3 flex-col sm:flex-row">
              <button
                onClick={handleAddToCart}
                disabled={
                  (hasVariants && (!selectedVariant || selectedVariant.stock <= 0)) ||
                  isSuccess
                }
                className={`
                  flex-1 inline-flex items-center justify-center gap-3
                  px-8 py-4 rounded-full
                  text-xs uppercase tracking-[0.3em] font-bold
                  transition-all duration-300 shadow-xl
                  ${
                    isSuccess
                      ? "bg-emerald-500 text-black shadow-emerald-500/20"
                      : "bg-[var(--gold)] text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                  }
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                `}
              >
                {isSuccess ? (
                  <>
                    <Check size={16} className="stroke-[3]" />
                    Adicionado
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    Adicionar à sacola
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="
                  px-6 py-4 rounded-full
                  border border-white/20
                  text-xs uppercase tracking-[0.3em] font-medium text-white/80
                  hover:border-white hover:text-white transition-all
                "
              >
                Continuar comprando
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}