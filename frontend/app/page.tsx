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
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

    const firstChild = scrollRef.current
      .firstElementChild as HTMLElement | null;

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
    (product: Product) => {
      return resolveImage(product.image);
    },
    [resolveImage],
  );

  const getImages = useCallback(
    (product: Product) => {
      return product.medias?.map((m) => resolveImage(m.url)) ?? [];
    },
    [resolveImage],
  );

  const normalizeProduct = useCallback(
    (product: Product): QuickProduct => {
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        image: getCover(product),
        images: getImages(product),
        oldPrice: product.oldPrice ?? undefined,
        variants: product.variants ?? [],
      };
    },
    [getCover, getImages],
  );

  const heroSlides = useMemo<HeroSlide[]>(() => {
    if (!home?.hero || home.hero.length === 0) {
      return [];
    }

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

  const launchProducts = useMemo(() => {
    return home?.launches?.map((item) => item.product) ?? [];
  }, [home]);

  const promotionItems = useMemo(() => {
    return home?.promotions ?? [];
  }, [home]);

  const featuredPromotion = useMemo(() => {
    if (!promotionItems.length) return null;
    return promotionItems[0]?.product ?? null;
  }, [promotionItems]);

  const featuredPromotionBanner = useMemo(() => {
    if (!promotionItems.length) {
      return null;
    }

    const firstPromotion = promotionItems[0].product;
    const promotionImages = getImages(firstPromotion);

    if (promotionImages.length > 0) {
      return promotionImages[0];
    }

    return getCover(firstPromotion);
  }, [promotionItems, getCover, getImages]);
  function generateFallbackLookbook(
    products: HomeSectionItem[],
  ): LookbookItem[] {
    if (!products || products.length === 0) return [];

    // 🔥 limita e garante previsibilidade
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
    // 🔥 prioridade: backend (se existir)
    if (home?.lookbook && home.lookbook.length > 0) {
      return home.lookbook;
    }

    // 🔥 fallback inteligente (launches + promotions)
    const fallback = generateFallbackLookbook([
      ...(home?.launches ?? []),
      ...(home?.promotions ?? []),
    ]);

    return fallback.length > 0 ? fallback : [];
  }, [home]);

  if (loading) {
    return (
      <section className="min-h-[70vh] bg-black">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-8">
          <div className="h-[70vh] rounded-3xl border border-white/10 bg-white/[0.03] animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <>
      <HeroParallax slides={heroSlides.length > 0 ? heroSlides : undefined} />

      <section className="relative overflow-hidden bg-black py-14 pb-20 md:py-20">
        <Reveal>
          <Section
            id="lancamentos"
            title={<span className="bs-title">Lançamentos</span>}
            subtitle="Novidades que definem a temporada."
          >
            <div className="relative -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-10">
              <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-black via-black/70 to-transparent md:w-16" />
              <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-black via-black/70 to-transparent md:w-16" />

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

              <div
                ref={scrollRef}
                className="
    scrollbar-hide
    flex gap-4
    overflow-x-auto
    overflow-y-hidden
    px-4
    scroll-smooth
    snap-x snap-proximity
    sm:px-6
    md:gap-6 md:px-8
    lg:px-10
  "
                style={{
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {launchProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="
                    min-w-[85%] snap-start
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
                        variants={product.variants}
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

      <section className="relative bg-gradient-to-b from-[#0f0c06] via-[#0a0907] to-black py-24 md:py-32">
        <Reveal>
          <Section
            title={<span className="bs-title">Mais vendidos da semana</span>}
            subtitle="As peças que mais conquistaram nossas clientes."
          >
            <WeeklyBestSellers
              items={home?.bestSellers ?? []}
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
        <LookbookTyped items={lookbookItems} />
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

      <section
        id="promocao"
        className="relative overflow-hidden py-24 md:py-32"
      >
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
                  onQuickView={() =>
                    setQuickProduct(normalizeProduct(featuredPromotion))
                  }
                />
              </div>
            )}
          </div>

          <div className="relative h-[420px] overflow-hidden rounded-3xl md:h-[520px] lg:h-[600px]">
            {featuredPromotionBanner ? (
              <Image
                src={featuredPromotionBanner}
                alt="Promoção"
                fill
                className="object-cover"
              />
            ) : (
              <Image
                src="/images/product-3.jpg"
                alt="Promoção"
                fill
                className="object-cover"
              />
            )}
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
