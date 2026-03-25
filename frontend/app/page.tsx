"use client";

import HeroParallax from "@/components/home/HeroParallax";
import Section from "@/components/ui/Section";
import ProductCard from "@/components/ui/ProductCard";
import Reveal from "@/components/ui/Reveal";
import Image from "next/image";
import Lookbook from "@/components/sections/Lookbook";
import InstagramShowcase from "@/components/sections/InstagramShowcase";
import { apiFetch } from "@/lib/api";
import ProductQuickView from "@/components/ui/ProductQuickView";
import WeeklyBestSellers from "@/components/sections/WeeklyBestSellers";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  const scrollRef = useRef<HTMLDivElement | null>(null);

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

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;

    const card = scrollRef.current.querySelector("div");
    if (!card) return;

    const cardWidth = (card as HTMLElement).offsetWidth + 24;

    scrollRef.current.scrollBy({
      left: direction === "left" ? -cardWidth : cardWidth,
      behavior: "smooth",
    });
  }

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
      <section className="relative py-14 md:py-20 overflow-hidden bg-black pb-20">
        <Reveal>
          <Section
            id="lancamentos"
            title={<span className="bs-title">Lançamentos</span>}
            subtitle="Novidades que definem a temporada."
          >
            {/* CONTROLE DE LAYOUT */}
            <div className="relative -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-10">
              {/* FADE LATERAL MAIS SUAVE */}
              <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 md:w-16 bg-gradient-to-r from-black via-black/70 to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 md:w-16 bg-gradient-to-l from-black via-black/70 to-transparent" />

              {/* BOTÕES */}
              <button
                onClick={() => scroll("left")}
                className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 backdrop-blur-lg transition hover:border-[var(--gold)] md:flex"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                onClick={() => scroll("right")}
                className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 backdrop-blur-lg transition hover:border-[var(--gold)] md:flex"
              >
                <ChevronRight size={16} />
              </button>

              {/* SCROLL */}
              <div
                ref={scrollRef}
                className="
            scrollbar-hide
            flex gap-4 md:gap-6
            overflow-x-auto
            scroll-smooth
            snap-x snap-mandatory

            px-4 sm:px-6 md:px-8 lg:px-10
          "
              >
                {products.slice(0, 10).map((product, index) => (
                  <div
                    key={product.id}
                    className="
                snap-start

                min-w-[78%]
                sm:min-w-[48%]
                md:min-w-[32%]
                lg:min-w-[24%]
                xl:min-w-[20%]
              "
                  >
                    <Reveal delay={0.06 * (index + 1)}>
                      <ProductCard
                        id={product.id}
                        slug={product.slug}
                        image={getCover(product)}
                        images={getImages(product)}
                        name={product.name}
                        price={product.price}
                        oldPrice={product.oldPrice ?? undefined}
                        stock={product.stock}
                        onQuickView={() =>
                          setQuickProduct(normalizeProduct(product))
                        }
                      />
                    </Reveal>
                  </div>
                ))}
              </div>
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

      <section className="relative overflow-hidden bg-gradient-to-r from-black via-[#1a1408] to-black py-24 md:py-32">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[var(--gold)] opacity-10 blur-[120px]" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 md:gap-24 md:px-8 lg:grid-cols-2">
          <Reveal>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                Conecte-se
              </p>

              <h2 className="mt-6 text-4xl font-light leading-tight md:text-5xl lg:text-6xl">
                <span className="block text-white">Muito além</span>
                <span className="bs-title block">de uma loja online</span>
              </h2>

              <p className="mt-8 max-w-xl leading-relaxed text-white/65">
                Mais do que vestir, é sobre presença, atitude e identidade.
              </p>

              <div className="mt-14 flex flex-col gap-5 sm:flex-row sm:gap-6">
                <a
                  href="https://instagram.com/blackstoreloja1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-4 rounded-full border border-white/20 px-8 py-4 text-xs uppercase tracking-[0.35em] text-white/80 transition-all duration-300 hover:border-[var(--gold)] hover:text-[var(--gold)] sm:px-10"
                >
                  Instagram Blackstore
                </a>

                <a
                  href="https://wa.me/5562994694804"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-4 rounded-full bg-[var(--gold)] px-10 py-4 text-xs font-medium uppercase tracking-[0.35em] text-black transition-all duration-300 hover:scale-[1.05] active:scale-[0.97] sm:px-12"
                >
                  Atendimento via WhatsApp
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="bs-glass relative flex h-[420px] items-center justify-center overflow-hidden rounded-3xl md:h-[520px]">
              <div className="absolute inset-0 bg-gradient-to-br from-black via-[#1a1408] to-black opacity-80" />
              <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-60" />

              <div className="relative px-6 text-center">
                <p className="text-xs uppercase tracking-[0.5em] text-white/40">
                  Comunidade
                </p>

                <h3 className="mt-6 text-2xl font-light text-white md:text-3xl">
                  Blackstore Experience
                </h3>

                <p className="mt-4 text-sm text-white/50">
                  Faça parte. Vista atitude.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Reveal>
        <InstagramShowcase />
      </Reveal>

      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#1a1408] to-black" />

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 md:gap-20 md:px-8 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">
              Oferta especial
            </p>

            <h2 className="mt-6 text-4xl font-light leading-tight md:text-5xl lg:text-6xl">
              <span className="block">Promoção</span>
              <span className="bs-title block">da semana</span>
            </h2>

            {products[0] && (
              <div className="mt-10 max-w-sm md:mt-12">
                <ProductCard
                  id={products[0].id}
                  slug={products[0].slug}
                  image={getCover(products[0])}
                  images={getImages(products[0])}
                  name={products[0].name}
                  price={products[0].price}
                  oldPrice={products[0].oldPrice ?? undefined}
                  stock={products[0].stock}
                  highlight
                  badge="OFERTA"
                  onQuickView={() =>
                    setQuickProduct(normalizeProduct(products[0]))
                  }
                />
              </div>
            )}
          </div>

          <div className="relative h-[420px] overflow-hidden rounded-3xl md:h-[520px] lg:h-[600px]">
            <Image
              src="/images/product-3.jpg"
              alt="Promoção"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {quickProduct && (
        <ProductQuickView
          product={quickProduct}
          onClose={() => setQuickProduct(null)}
        />
      )}
    </>
  );
}
