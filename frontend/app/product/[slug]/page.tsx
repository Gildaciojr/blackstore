"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, AlertCircle } from "lucide-react";
import { useCart } from "@/store/cart";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";

type Media = {
  id: string;
  type?: string;
  title?: string | null;
  url: string;
  productId?: string | null;
  createdAt?: string;
};

type Variant = {
  id: string;
  size: string;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  oldPrice?: number | null;
  image: string;
  stock: number;
  categoryId: string;
  createdAt: string;
  medias?: Media[];
  variants?: Variant[];
};

type Props = {
  params: {
    slug: string;
  };
};

export default function ProductPage({ params }: Props) {
  const addItem = useCart((s) => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [sizeError, setSizeError] = useState(false);

  function resolveImage(url: string) {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/images")) return url;

    const normalizedPath = url.startsWith("/") ? url : `/${url}`;
    return `${process.env.NEXT_PUBLIC_API_URL}${normalizedPath}`;
  }

  useEffect(() => {
    if (!params?.slug) return;

    async function loadProduct() {
      try {
        const data = await apiFetch<Product>(`/products/${params.slug}`);
        setProduct(data);
        setSelectedVariant(null);

        const mainImage = resolveImage(data.image);
        const mediaImages = (data.medias ?? [])
          .map((media) => resolveImage(media.url))
          .filter(Boolean);

        setSelectedImage(mediaImages[0] || mainImage);
      } catch (error) {
        console.error("Erro ao carregar produto:", error);
      }
    }

    loadProduct();
  }, [params?.slug]);

  const galleryImages = useMemo(() => {
    if (!product) return [];

    const mainImage = resolveImage(product.image);
    const mediaImages = (product.medias ?? [])
      .map((media) => resolveImage(media.url))
      .filter(Boolean);

    const merged = [mainImage, ...mediaImages].filter(Boolean);
    return Array.from(new Set(merged));
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white/60">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs uppercase tracking-widest">
          Carregando coleção...
        </p>
      </div>
    );
  }

  const imageUrl = selectedImage || resolveImage(product.image);
  const hasVariants =
    Array.isArray(product.variants) && product.variants.length > 0;

  // LÓGICA DE ESTOQUE CORRIGIDA
  const totalStock = hasVariants
    ? product.variants!.reduce((acc, v) => acc + v.stock, 0)
    : product.stock;

  const isCompletelyOutOfStock = totalStock <= 0;
  const isSelectedOutOfStock = selectedVariant
    ? selectedVariant.stock <= 0
    : false;
  const isDisabled = isCompletelyOutOfStock || isSelectedOutOfStock;

  function getButtonText() {
    if (isCompletelyOutOfStock) return "Esgotado";
    if (isSelectedOutOfStock) return "Tamanho Esgotado";
    return "Adicionar ao carrinho";
  }

  function handleAddToCart() {
    if (hasVariants && !selectedVariant) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 3000);

      // Rola a tela suavemente para as variantes no mobile
      window.scrollTo({ top: 400, behavior: "smooth" });
      return;
    }

    if (isDisabled) return;

    addItem({
      id: product!.id,
      name: product!.name,
      price: product!.price,
      image: imageUrl,
      variantId: selectedVariant?.id,
      size: selectedVariant?.size,
    });
  }

  return (
    <section className="relative min-h-screen bg-black text-white pb-32 lg:pb-20">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0b0906] to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.08),transparent_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-24 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-start">
        {/* GALERIA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:gap-6 lg:sticky lg:top-32"
        >
          <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02]">
            <Image
              key={imageUrl}
              src={imageUrl || "/images/placeholder.png"}
              alt={product.name}
              fill
              className="object-cover transition duration-700 hover:scale-[1.04]"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          <div className="grid grid-cols-4 gap-3">
            {(galleryImages.length ? galleryImages : [imageUrl]).map(
              (img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`
                  relative aspect-square rounded-xl overflow-hidden border transition cursor-pointer bg-white/[0.02]
                  ${
                    imageUrl === img
                      ? "border-[var(--gold)] opacity-100 ring-1 ring-[var(--gold)]/50"
                      : "border-white/10 opacity-60 hover:opacity-100 hover:border-white/30"
                  }
                `}
                >
                  <Image
                    src={img || "/images/placeholder.png"}
                    alt={`${product.name} ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ),
            )}
          </div>
        </motion.div>

        {/* CONTEÚDO */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col"
        >
          <p className="uppercase text-[10px] tracking-[0.45em] text-white/40">
            Blackstore Collection
          </p>

          <h1 className="mt-3 text-3xl md:text-5xl font-light leading-tight">
            {product.name}
          </h1>

          <div className="mt-8 flex items-center gap-4 border-b border-white/10 pb-8">
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="text-white/40 line-through text-lg md:text-xl">
                R${" "}
                {product.oldPrice.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            )}
            <span className="text-3xl md:text-4xl font-semibold text-[var(--gold)]">
              R${" "}
              {product.price.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          {product.description && (
            <div className="mt-8">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-3">
                Detalhes
              </p>
              <p className="text-white/70 max-w-md leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}

          {/* VARIANTES */}
          {hasVariants && (
            <div className="mt-10" id="variants-section">
              <div className="flex items-center gap-3 mb-4">
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/50">
                  Escolha o tamanho
                </p>
                {sizeError && (
                  <span className="text-red-400 text-[10px] flex items-center gap-1 uppercase tracking-widest animate-pulse">
                    <AlertCircle size={12} /> Obrigatório
                  </span>
                )}
              </div>

              <div
                className={`flex gap-3 flex-wrap p-1 rounded-2xl transition-all duration-300 ${sizeError ? "bg-red-500/10 ring-1 ring-red-500/50" : ""}`}
              >
                {product.variants!.map((v) => {
                  const disabled = v.stock <= 0;

                  return (
                    <button
                      key={v.id}
                      disabled={disabled}
                      onClick={() => {
                        setSelectedVariant(v);
                        setSizeError(false);
                      }}
                      className={`
                        min-w-[3rem] h-12 px-4 rounded-full border text-sm font-medium
                        flex items-center justify-center
                        transition-all duration-200
                        ${
                          selectedVariant?.id === v.id
                            ? "bg-[var(--gold)] text-black border-[var(--gold)] shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                            : "border-white/20 text-white hover:border-white/60 bg-black/50"
                        }
                        ${disabled ? "opacity-30 cursor-not-allowed bg-transparent" : ""}
                      `}
                    >
                      {v.size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA DESKTOP */}
          <div className="hidden lg:flex mt-12 flex-col sm:flex-row gap-4">
            <button
              onClick={handleAddToCart}
              className={`
                flex-1
                inline-flex items-center justify-center gap-3
                px-10 py-4 rounded-full
                uppercase tracking-[0.35em] text-xs font-medium
                transition-all duration-300
                ${
                  isCompletelyOutOfStock || isSelectedOutOfStock
                    ? "bg-white/10 text-white/40 border border-white/10 cursor-not-allowed"
                    : "bg-[var(--gold)] text-black shadow-[0_10px_30px_rgba(212,175,55,0.25)] hover:scale-[1.02] active:scale-[0.98]"
                }
              `}
            >
              <ShoppingBag size={18} />
              {getButtonText()}
            </button>

            <a
              href="https://wa.me/5562994694804"
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex-1
                inline-flex items-center justify-center
                px-10 py-4 rounded-full
                border border-white/20 bg-white/[0.02]
                uppercase tracking-[0.35em] text-xs text-white/90
                hover:border-[var(--gold)] hover:text-[var(--gold)]
                transition-all duration-300
              "
            >
              Dúvidas? WhatsApp
            </a>
          </div>

          <div className="mt-14 border-t border-white/10 pt-6 space-y-3 text-xs md:text-sm text-white/50 tracking-wide">
            <p>✦ Envio rápido e seguro para todo o Brasil</p>
            <p>✦ Troca facilitada em até 7 dias</p>
            <p>✦ Atendimento premium especializado</p>
          </div>
        </motion.div>
      </div>

      {/* 🔥 BARRA FIXA MOBILE (APP FEEL) */}
      <div className="fixed bottom-0 left-0 w-full bg-black/95 backdrop-blur-xl border-t border-white/10 p-4 pb-safe flex items-center justify-between lg:hidden z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        <div className="flex flex-col">
          {product.oldPrice && product.oldPrice > product.price && (
            <span className="text-white/40 line-through text-[10px]">
              R${" "}
              {product.oldPrice.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </span>
          )}
          <span className="text-[var(--gold)] font-semibold text-lg leading-none">
            R${" "}
            {product.price.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          className={`
            px-6 py-3.5 rounded-full
            uppercase tracking-[0.2em] text-[10px] font-medium
            transition-all duration-300 flex items-center gap-2
            ${
              isCompletelyOutOfStock || isSelectedOutOfStock
                ? "bg-white/10 text-white/50"
                : "bg-[var(--gold)] text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] active:scale-95"
            }
          `}
        >
          {getButtonText()}
        </button>
      </div>
    </section>
  );
}
