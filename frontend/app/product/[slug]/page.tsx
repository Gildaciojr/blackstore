"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center text-white/60">
        Carregando produto...
      </div>
    );
  }

  const imageUrl = selectedImage || resolveImage(product.image);

  const hasVariants =
    Array.isArray(product.variants) && product.variants.length > 0;

  const isOutOfStock = hasVariants
    ? !selectedVariant || selectedVariant.stock <= 0
    : product.stock <= 0;

  return (
    <section className="relative min-h-screen bg-black text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0b0906] to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.08),transparent_60%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* GALERIA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden border border-white/10">
            <Image
              key={imageUrl}
              src={imageUrl || "/images/placeholder.png"}
              alt={product.name}
              fill
              className="object-cover transition duration-700 hover:scale-[1.04]"
              priority
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          <div className="grid grid-cols-4 gap-3">
            {(galleryImages.length
              ? galleryImages
              : [imageUrl, imageUrl, imageUrl, imageUrl]
            ).map((img, i) => (
              <button
                key={`${img}-${i}`}
                type="button"
                onClick={() => setSelectedImage(img)}
                className={`
                  relative aspect-square rounded-xl overflow-hidden border transition cursor-pointer
                  ${
                    imageUrl === img
                      ? "border-[var(--gold)]"
                      : "border-white/10 hover:border-[var(--gold)]"
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
            ))}
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

          <h1 className="mt-4 text-4xl md:text-5xl font-light leading-tight">
            {product.name}
          </h1>

          {product.description && (
            <p className="mt-6 text-white/65 max-w-md leading-relaxed text-sm md:text-base">
              {product.description}
            </p>
          )}

          <div className="mt-10 flex items-center gap-4">
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="text-white/40 line-through text-lg">
                R$ {product.oldPrice.toLocaleString("pt-BR")}
              </span>
            )}

            <span className="text-3xl md:text-4xl font-semibold text-[var(--gold)]">
              R$ {product.price.toLocaleString("pt-BR")}
            </span>
          </div>

          {/* VARIANTES */}
          {hasVariants && (
            <div className="mt-10">
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/50 mb-4">
                Escolha o tamanho
              </p>

              <div className="flex gap-3 flex-wrap">
                {product.variants!.map((v) => {
                  const disabled = v.stock <= 0;

                  return (
                    <button
                      key={v.id}
                      disabled={disabled}
                      onClick={() => setSelectedVariant(v)}
                      className={`
                        w-12 h-12 rounded-full border text-sm
                        flex items-center justify-center
                        transition-all duration-200
                        ${
                          selectedVariant?.id === v.id
                            ? "bg-[var(--gold)] text-black border-[var(--gold)]"
                            : "border-white/20 text-white hover:border-white"
                        }
                        ${disabled ? "opacity-30 cursor-not-allowed" : ""}
                      `}
                    >
                      {v.size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <button
              disabled={isOutOfStock}
              onClick={() => {
                if (isOutOfStock) return;

                addItem({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: imageUrl,
                  variantId: selectedVariant?.id,
                  size: selectedVariant?.size,
                });
              }}
              className="
                flex-1
                inline-flex items-center justify-center gap-3
                px-10 py-4 rounded-full
                bg-[var(--gold)] text-black
                uppercase tracking-[0.35em] text-xs font-medium
                shadow-[0_10px_30px_rgba(212,175,55,0.25)]
                hover:scale-105 active:scale-[0.98]
                transition-all duration-300
                disabled:opacity-40
              "
            >
              <ShoppingBag size={18} />
              {isOutOfStock ? "Indisponível" : "Adicionar ao carrinho"}
            </button>

            <a
              href="https://wa.me/5562994694804"
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex-1
                inline-flex items-center justify-center
                px-10 py-4 rounded-full
                border border-white/20
                uppercase tracking-[0.35em] text-xs
                hover:border-[var(--gold)] hover:text-[var(--gold)]
                transition-all duration-300
              "
            >
              Comprar via WhatsApp
            </a>
          </div>

          <div className="mt-14 border-t border-white/10 pt-6 space-y-2 text-sm text-white/60">
            <p>✓ Envio rápido para todo o Brasil</p>
            <p>✓ Troca fácil em até 7 dias</p>
            <p>✓ Atendimento premium Blackstore</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
