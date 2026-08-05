"use client";

import HeroParallax from "@/components/home/HeroParallax";
import ProductCard from "@/components/ui/ProductCard";
import Reveal from "@/components/ui/Reveal";
import Image from "next/image";
import Link from "next/link";
import Lookbook from "@/components/sections/Lookbook";
import InstagramShowcase from "@/components/sections/InstagramShowcase";
import { apiFetch } from "@/lib/api";
import ProductQuickView from "@/components/ui/ProductQuickView";
import WeeklyBestSellers from "@/components/sections/WeeklyBestSellers";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";

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
  medias?: Media[];
  variants?: Variant[];
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
  variants?: Variant[];
  description?: string;
};

type WeeklyBestSellerItem = {
  id: string;
  position: number;
  productId: string;
  product: Product;
};

type HeroSlideApi = {
  id: string;
  position: number;
  product: Product;
  hero: {
    type?: "COLLECTION" | "PRODUCT" | "PROMO" | null;
    image?: string | null;
    focus?: string | null;
    focusDesktop?: string | null;
    title1?: string | null;
    title2?: string | null;
    subtitle?: string | null;
    cta1?: string | null;
    cta2?: string | null;
  };
};

type HomeSectionItem = {
  id: string;
  position: number;
  product: Product;
};

type LookbookItem = {
  id: string;
  position: number;
  type: "TOP" | "BOTTOM";
  label?: string | null;
  top?: string | null;
  left?: string | null;
  fabric?: string | null;
  active: boolean;
  product: Product;
};

type HomeResponse = {
  hero: HeroSlideApi[];
  launches: HomeSectionItem[];
  promotions: HomeSectionItem[];
  lookbook: LookbookItem[];
  bestSellers: WeeklyBestSellerItem[];
};

type HeroParallaxSlides = ComponentProps<typeof HeroParallax>["slides"];
type HeroSlide = NonNullable<HeroParallaxSlides>[number];

const LookbookTyped = Lookbook as unknown as React.ComponentType<{
  items: LookbookItem[];
}>;

export default function HomePage() {
  const [home, setHome] = useState<HomeResponse | null>(null);
  const [quickProduct, setQuickProduct] = useState<QuickProduct | null>(null);
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadHome() {
      try {
        setLoading(true);
        const data = await apiFetch<HomeResponse>("/home");
        setHome(data);
      } catch (err) {
        console.error("Erro ao carregar dados da home", err);
      } finally {
        setLoading(false);
      }
    }

    void loadHome();
  }, []);

  const scroll = useCallback((direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const firstChild = scrollRef.current.firstElementChild as HTMLElement | null;
    if (!firstChild) return;

    const cardWidth = firstChild.offsetWidth + 24;

    scrollRef.current.scrollBy({
      left: direction === "left" ? -cardWidth : cardWidth,
      behavior: "smooth",
    });
  }, []);

  const resolveImage = useCallback((url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/images")) return url;

    const normalizedPath = url.startsWith("/") ? url : `/${url}`;
    return `${process.env.NEXT_PUBLIC_API_URL}${normalizedPath}`;
  }, []);

  const getCover = useCallback(
    (product: Product) => resolveImage(product.image),
    [resolveImage]
  );

  const getImages = useCallback(
    (product: Product) => product.medias?.map((m) => resolveImage(m.url)) ?? [],
    [resolveImage]
  );

  const normalizeProduct = useCallback(
    (product: Product): QuickProduct => ({
      id: product.id,
      name: product.name,
      price: product.price,
      image: getCover(product),
      images: getImages(product),
      oldPrice: product.oldPrice ?? undefined,
      variants: product.variants ?? [],
      description: product.description ?? "",
    }),
    [getCover, getImages]
  );

  const heroSlides = useMemo<HeroSlide[]>(() => {
    if (!home?.hero || home.hero.length === 0) return [];

    return home.hero.map<HeroSlide>((item) => {
      const normalizedType: HeroSlide["type"] =
        item.hero.type === "PROMO"
          ? "promo"
          : item.hero.type === "PRODUCT"
            ? "product"
            : "collection";

      return {
        type: normalizedType,
        image: resolveImage(item.hero.image ?? item.product.image),
        focus: item.hero.focus ?? "center 25%",
        focusDesktop: item.hero.focusDesktop ?? "center 22%",
        title1: item.hero.title1 ?? item.product.name,
        title2: item.hero.title2 ?? "Blackstore",
        subtitle:
          item.hero.subtitle ??
          item.product.description ??
          "Peças premium selecionadas para destacar sua presença.",
        cta1: item.hero.cta1 ?? "#lancamentos",
        cta2: item.hero.cta2 ?? `/product/${item.product.slug}`,
      };
    });
  }, [home, resolveImage]);

  const launchProducts = useMemo(() => home?.launches?.map((item) => item.product) ?? [], [home]);
  const promotionItems = useMemo(() => home?.promotions ?? [], [home]);
  const featuredPromotion = useMemo(() => promotionItems[0]?.product ?? null, [promotionItems]);

  const featuredPromotionBanner = useMemo(() => {
    if (!promotionItems.length) return null;
    const firstPromotion = promotionItems[0].product;
    const promotionImages = getImages(firstPromotion);

    if (promotionImages.length > 0) return promotionImages[0];
    return getCover(firstPromotion);
  }, [promotionItems, getCover, getImages]);

  function generateFallbackLookbook(products: HomeSectionItem[]): LookbookItem[] {
    if (!products || products.length === 0) return [];

    const safeProducts = products.slice(0, 6);
    const result: LookbookItem[] = [];

    safeProducts.forEach((p, i) => {
      const isTop = i % 2 === 0;
      result.push({
        id: `${isTop ? "top" : "bottom"}-${p.product.id}`,
        position: i + 1,
        type: isTop ? "TOP" : "BOTTOM",
        active: true,
        product: p.product,
        top: isTop ? "30%" : "65%",
        left: isTop ? "60%" : "50%",
      });
    });

    return result;
  }

  const lookbookItems = useMemo(() => {
    if (home?.lookbook && home.lookbook.length > 0) return home.lookbook;

    const fallback = generateFallbackLookbook([
      ...(home?.launches ?? []),
      ...(home?.promotions ?? []),
    ]);

    return fallback.length > 0 ? fallback : [];
  }, [home]);

  if (loading) {
    return (
      <section className="min-h-screen bg-[#0b0b0d] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-white/60 text-xs tracking-[0.35em] uppercase">Carregando Blackstore...</p>
      </section>
    );
  }

  return (
    <>
      <HeroParallax slides={heroSlides.length > 0 ? heroSlides : undefined} />

      {/* 🔥 SEÇÃO DE LANÇAMENTOS MODERNIZADA (SEM ESPAÇO MORTO) */}
      <section id="lancamentos" className="relative overflow-hidden py-16 sm:py-20 md:py-24 lg:py-28">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <Reveal>
            {/* HEADER DA SEÇÃO COM NAVEGAÇÃO INTEGRADA */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="h-px w-8 bg-[var(--gold)]/60" />
                  <p className="text-[10px] tracking-[0.45em] uppercase text-[var(--gold)] font-semibold flex items-center gap-1.5">
                    <Sparkles size={12} /> Edição Exclusiva
                  </p>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-light leading-tight">
                  <span className="bs-title">Lançamentos</span>
                </h2>
                <p className="mt-3 text-white/60 text-xs sm:text-sm md:text-base max-w-xl leading-relaxed">
                  Novidades selecionadas que redefinem o estilo e destacam sua presença nesta temporada.
                </p>
              </div>

              {/* BOTÕES DE CONTROLE DESKTOP + LINK DO CATÁLOGO */}
              <div className="flex items-center justify-between md:justify-end gap-4 border-t border-white/10 pt-4 md:border-none md:pt-0">
                <Link
                  href="/catalog"
                  className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/70 hover:text-[var(--gold)] transition-colors"
                >
                  Ver Tudo no Catálogo
                  <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="hidden md:flex items-center gap-2 pl-4 border-l border-white/10">
                  <button
                    onClick={() => scroll("left")}
                    aria-label="Rolar para a esquerda"
                    className="w-11 h-11 rounded-full border border-white/15 bg-white/5 backdrop-blur-xl flex items-center justify-center text-white hover:border-[var(--gold)] hover:text-[var(--gold)] hover:bg-white/10 transition-all active:scale-95 shadow-lg"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => scroll("right")}
                    aria-label="Rolar para a direita"
                    className="w-11 h-11 rounded-full border border-white/15 bg-white/5 backdrop-blur-xl flex items-center justify-center text-white hover:border-[var(--gold)] hover:text-[var(--gold)] hover:bg-white/10 transition-all active:scale-95 shadow-lg"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* TRACK DO CARROSSEL DE LANÇAMENTOS (LARGURA CALCULADA) */}
            <div className="relative">
              {/* Sombras laterais para indicação de scroll fluido */}
              <div className="pointer-events-none absolute -left-4 top-0 z-10 h-full w-10 bg-gradient-to-r from-[#0b0b0d] to-transparent md:-left-8 md:w-16" />
              <div className="pointer-events-none absolute -right-4 top-0 z-10 h-full w-10 bg-gradient-to-l from-[#0b0b0d] to-transparent md:-right-8 md:w-16" />

              <div
                ref={scrollRef}
                className="
                  scrollbar-hide
                  flex gap-4 sm:gap-6 md:gap-8
                  overflow-x-auto
                  overflow-y-hidden
                  scroll-smooth
                  snap-x snap-mandatory
                  py-2
                "
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {launchProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="
                      w-[80%] 
                      sm:w-[calc(50%-12px)] 
                      md:w-[calc(33.333%-16px)] 
                      lg:w-[calc(25%-18px)] 
                      xl:w-[calc(20%-20px)]
                      flex-shrink-0 
                      snap-start snap-always
                    "
                  >
                    <Reveal delay={0.05 * (index + 1)}>
                      <ProductCard
                        id={product.id}
                        slug={product.slug}
                        image={getCover(product)}
                        images={getImages(product)}
                        name={product.name}
                        price={product.price}
                        oldPrice={product.oldPrice ?? undefined}
                        stock={product.stock}
                        variants={product.variants}
                        badge="NOVO"
                        onQuickView={() => setQuickProduct(normalizeProduct(product))}
                      />
                    </Reveal>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* MAIS VENDIDOS */}
      <section className="relative py-24 md:py-32">
        <Reveal>
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-3">
                <span className="h-px w-8 bg-[var(--gold)]/60" />
                <p className="text-[10px] tracking-[0.45em] uppercase text-white/40">Blackstore</p>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light leading-tight">
                <span className="bs-title">Mais vendidos da semana</span>
              </h2>
              <p className="mt-3 text-white/60 text-xs sm:text-sm md:text-base leading-relaxed">
                As peças que mais conquistaram nossas clientes.
              </p>
            </div>

            <WeeklyBestSellers
              items={home?.bestSellers ?? []}
              getCover={getCover}
              getImages={getImages}
              onQuickView={(product: Product) => setQuickProduct(normalizeProduct(product))}
            />
          </div>
        </Reveal>
      </section>

      <Reveal>
        <LookbookTyped items={lookbookItems} />
      </Reveal>

      {/* SEÇÃO CONECTE-SE */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[var(--gold)] opacity-[0.03] blur-[120px]" />

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

              <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:gap-6">
                <a
                  href="https://instagram.com/blackstoreloja1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    group inline-flex items-center justify-center rounded-full border border-white/20
                    px-6 py-4 sm:px-8
                    text-xs uppercase tracking-[0.35em] text-white/80
                    transition-colors duration-200 hover:border-[var(--gold)] hover:text-[var(--gold)]
                  "
                >
                  Instagram Blackstore
                </a>

                <a
                  href="https://wa.me/5562994694804"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    group inline-flex items-center justify-center rounded-full bg-[var(--gold)]
                    px-6 py-4 sm:px-10
                    text-xs font-medium uppercase tracking-[0.35em] text-black
                    transition-transform duration-200 sm:hover:scale-[1.05] active:scale-[0.97]
                  "
                >
                  Atendimento via WhatsApp
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="bs-glass relative flex h-[420px] items-center justify-center overflow-hidden rounded-3xl md:h-[520px]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0b0b0d] via-[#1a1408] to-[#0b0b0d] opacity-50" />
              <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-60" />

              <div className="relative px-6 text-center">
                <p className="text-xs uppercase tracking-[0.5em] text-white/40">Comunidade</p>
                <h3 className="mt-6 text-2xl font-light text-white md:text-3xl">Blackstore Experience</h3>
                <p className="mt-4 text-sm text-white/50">Faça parte. Vista atitude.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Reveal>
        <InstagramShowcase />
      </Reveal>

      {/* PROMOÇÃO DA SEMANA */}
      <section id="promocao" className="relative overflow-hidden py-24 md:py-32">
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 md:gap-20 md:px-8 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Oferta especial</p>
            <h2 className="mt-6 text-4xl font-light leading-tight md:text-5xl lg:text-6xl">
              <span className="block">Promoção</span>
              <span className="bs-title block">da semana</span>
            </h2>

            {featuredPromotion && (
              <div className="mt-10 max-w-sm md:mt-12">
                <ProductCard
                  id={featuredPromotion.id}
                  slug={featuredPromotion.slug}
                  image={getCover(featuredPromotion)}
                  images={getImages(featuredPromotion)}
                  name={featuredPromotion.name}
                  price={featuredPromotion.price}
                  oldPrice={featuredPromotion.oldPrice ?? undefined}
                  stock={featuredPromotion.stock}
                  variants={featuredPromotion.variants}
                  highlight
                  badge="OFERTA"
                  onQuickView={() => setQuickProduct(normalizeProduct(featuredPromotion))}
                />
              </div>
            )}
          </div>

          <div className="relative h-[360px] sm:h-[420px] md:h-[520px] lg:h-[600px] overflow-hidden rounded-3xl border border-white/5">
            <Image
              src={featuredPromotionBanner || "/images/product-3.jpg"}
              alt="Promoção"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
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