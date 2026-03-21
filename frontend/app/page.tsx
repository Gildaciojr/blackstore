"use client";

import HeroParallax from "@/components/home/HeroParallax";
import Section from "@/components/ui/Section";
import ProductCard from "@/components/ui/ProductCard";
import Reveal from "@/components/ui/Reveal";
import Image from "next/image";
import Lookbook from "@/components/sections/Lookbook";
import CompleteLook from "@/components/sections/CompleteLook";
import InstagramShowcase from "@/components/sections/InstagramShowcase";
import { apiFetch } from "@/lib/api";
import ProductQuickView from "@/components/ui/ProductQuickView";
import WeeklyBestSellers from "@/components/sections/WeeklyBestSellers";
import { useEffect, useState } from "react";

type Media = {
  id: string;
  type?: string;
  title?: string | null;
  url: string;
  productId?: string | null;
  createdAt?: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  oldPrice?: number | null;
  image: string;
  medias?: Media[];
  stock: number;
  categoryId: string;
  createdAt: string;
};

type QuickProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  images: string[];
  oldPrice?: number;
};

type WeeklyBestSellerItem = {
  id: string;
  position: number;
  productId: string;
  product: Product;
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quickProduct, setQuickProduct] = useState<QuickProduct | null>(null);
  const [weekly, setWeekly] = useState<WeeklyBestSellerItem[]>([]);

  useEffect(() => {
    async function load() {
      const data = await apiFetch<Product[]>("/products");
      setProducts(data);
    }

    load();
  }, []);

  useEffect(() => {
    async function loadWeekly() {
      try {
        const data = await apiFetch<WeeklyBestSellerItem[]>(
          "/weekly-best-sellers",
        );
        setWeekly(data);
      } catch (err) {
        console.error("Erro ao carregar ranking semanal", err);
      }
    }

    loadWeekly();
  }, []);

  // ================= RESOLVER IMAGEM =================
  function resolveImage(url: string) {
    if (!url) return "";

    if (url.startsWith("/images")) return url;
    if (url.startsWith("http")) return url;

    return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
  }

  function getCover(product: Product) {
    return resolveImage(product.image);
  }

  function getImages(product: Product) {
    return product.medias?.map((m) => resolveImage(m.url)) ?? [];
  }

  // 🔥 NORMALIZA PRODUTO PARA QUICKVIEW
  function normalizeProduct(product: Product): QuickProduct {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      image: getCover(product),
      images: getImages(product),
      oldPrice: product.oldPrice ?? undefined,
    };
  }

  return (
    <>
      <HeroParallax />

      {/* ================= LANÇAMENTOS ================= */}
      <section className="relative bg-gradient-to-b from-black via-[#0b0906] to-[#0f0c06] py-20 md:py-28">
        <Reveal>
          <Section
            id="lancamentos"
            title={<span className="bs-title">Lançamentos</span>}
            subtitle="Novidades que definem a temporada."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
              {products.slice(0, 4).map((product, index) => (
                <Reveal key={product.id} delay={0.08 * (index + 1)}>
                  <ProductCard
                    id={product.id}
                    slug={product.slug}
                    image={getCover(product)}
                    images={getImages(product)}
                    name={product.name}
                    price={product.price}
                    oldPrice={product.oldPrice ?? undefined}
                    onQuickView={() =>
                      setQuickProduct(normalizeProduct(product))
                    }
                  />
                </Reveal>
              ))}
            </div>
          </Section>
        </Reveal>
      </section>

      {/* ================= MAIS VENDIDOS ================= */}
      <section className="relative bg-gradient-to-b from-[#0f0c06] via-[#0a0907] to-black py-24 md:py-32">
        <Reveal>
          <Section
            title={<span className="bs-title">Mais vendidos da semana</span>}
            subtitle="As peças que mais conquistaram nossas clientes."
          >
            <WeeklyBestSellers
              items={weekly}
              getCover={getCover}
              getImages={getImages}
              onQuickView={(product: Product) =>
                setQuickProduct(normalizeProduct(product))
              }
            />
          </Section>
        </Reveal>
      </section>

      <Reveal>
        <Lookbook />
      </Reveal>

      <Reveal>
        <CompleteLook />
      </Reveal>

      {/* ================= PROMOÇÃO ================= */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#1a1408] to-black" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-14 md:gap-20 items-center">
          <div>
            <p className="uppercase text-xs tracking-[0.4em] text-white/50">
              Oferta especial
            </p>

            <h2 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-light leading-tight">
              <span className="block">Promoção</span>
              <span className="block bs-title">da semana</span>
            </h2>

            {products[0] && (
              <div className="mt-10 md:mt-12 max-w-sm">
                <ProductCard
                  id={products[0].id}
                  slug={products[0].slug}
                  image={getCover(products[0])}
                  images={getImages(products[0])}
                  name={products[0].name}
                  price={products[0].price}
                  oldPrice={products[0].oldPrice ?? undefined}
                  highlight
                  badge="OFERTA"
                  onQuickView={() =>
                    setQuickProduct(normalizeProduct(products[0]))
                  }
                />
              </div>
            )}
          </div>

          <div className="relative h-[420px] md:h-[520px] lg:h-[600px] rounded-3xl overflow-hidden">
            <Image
              src="/images/product-3.jpg"
              alt="Promoção"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <Reveal>
        <InstagramShowcase />
      </Reveal>

      {/* ================= SOCIAL ================= */}
      <section className="py-24 md:py-32 bg-gradient-to-r from-black via-[#1a1408] to-black">
        <div
          className="max-w-7xl mx-auto px-6 md:px-8 
    grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center"
        >
          <Reveal>
            <div>
              <p className="text-xs tracking-[0.4em] uppercase text-white/50">
                Conecte-se
              </p>

              <h2 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-light leading-tight">
                <span className="block text-white">Muito além</span>
                <span className="block bs-title">de uma loja online</span>
              </h2>

              <p className="mt-8 text-white/65 max-w-xl leading-relaxed">
                A Blackstore é presença, atitude e relacionamento.
              </p>

              <div className="mt-14 flex flex-col sm:flex-row gap-5 sm:gap-6">
                <a
                  href="https://instagram.com/blackstoreloja1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-4 px-8 sm:px-10 py-4 
            rounded-full border border-white/20 text-xs tracking-[0.35em] uppercase 
            text-white/80 hover:border-[var(--gold)] hover:text-[var(--gold)] 
            transition-all duration-300"
                >
                  Instagram Blackstore
                </a>

                <a
                  href="https://wa.me/5562994694804"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-4 px-10 sm:px-12 py-4 
            rounded-full bg-[var(--gold)] text-black text-xs tracking-[0.35em] uppercase 
            font-medium hover:scale-[1.04] active:scale-[0.98] 
            transition-all duration-300"
                >
                  Atendimento via WhatsApp
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div
              className="relative h-[420px] md:h-[520px] 
        rounded-3xl bs-glass flex items-center justify-center"
            >
              <p className="text-center text-lg text-white/60 tracking-widest uppercase">
                Blackstore Experience
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= QUICK VIEW ================= */}
      {quickProduct && (
        <ProductQuickView
          product={quickProduct}
          onClose={() => setQuickProduct(null)}
        />
      )}
    </>
  );
}
