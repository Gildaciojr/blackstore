"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, ShoppingBag } from "lucide-react";
import { useCart } from "@/store/cart";
import ProductQuickView from "@/components/ui/ProductQuickView";

type Media = {
  id: string;
  url: string;
};

type Category = {
  id: string;
  name: string;
  slug: string;
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
  category: Category;
  createdAt: string;
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

type LookItemType = "top" | "bottom";

type LookItem = {
  id: string;
  type: LookItemType;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  images: string[];
  slug: string;
  fabric: string;
  sizes: string[];
  top: string;
  left: string;
};

type QuickProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  images: string[];
  oldPrice?: number;
};

type LookbookProps = {
  items?: LookbookItem[];
};

type LookSuggestion = {
  id: string;
  label: string;
  topId: string;
  bottomId: string;
};

function resolveImage(url: string) {
  if (!url) return "";

  if (url.startsWith("/images")) return url;
  if (url.startsWith("http")) return url;

  return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
}

function getImages(product: Product) {
  const gallery = product.medias?.map((media) => resolveImage(media.url)) ?? [];
  const cover = resolveImage(product.image);

  if (!gallery.length) return [cover];

  if (!gallery.includes(cover)) return [cover, ...gallery];

  return gallery;
}

function normalizeFromApi(item: LookbookItem): LookItem {
  const product = item.product;
  const type: LookItemType = item.type === "TOP" ? "top" : "bottom";

  return {
    id: product.id,
    type,
    name: product.name,
    price: product.price,
    oldPrice: product.oldPrice ?? undefined,
    image: resolveImage(product.image),
    images: getImages(product),
    slug: product.slug,
    fabric:
      item.fabric ||
      product.description?.trim() ||
      "Tecido premium com ajuste confortável e toque macio.",
    sizes: type === "top" ? ["PP", "P", "M", "G"] : ["P", "M", "G", "GG"],
    top: item.top ?? (type === "top" ? "30%" : "60%"),
    left: item.left ?? (type === "top" ? "60%" : "52%"),
  };
}

function toQuickProduct(item: LookItem): QuickProduct {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.image,
    images: item.images,
    oldPrice: item.oldPrice,
  };
}

export default function Lookbook({ items }: LookbookProps) {
  const addItem = useCart((s) => s.addItem);

  /**
   * 🔥 ESTADO MANUAL (USUÁRIO)
   */
  const [manualTop, setManualTop] = useState<LookItem | null>(null);
  const [manualBottom, setManualBottom] = useState<LookItem | null>(null);

  const [quickProduct, setQuickProduct] = useState<QuickProduct | null>(null);

  /**
   * 🔥 DERIVAÇÃO DO BACKEND
   */
  const tops = useMemo(() => {
    if (!items) return [];
    return items
      .filter((i) => i.type === "TOP" && i.active)
      .map(normalizeFromApi);
  }, [items]);

  const bottoms = useMemo(() => {
    if (!items) return [];
    return items
      .filter((i) => i.type === "BOTTOM" && i.active)
      .map(normalizeFromApi);
  }, [items]);

  /**
   * 🔥 ESTADO DERIVADO (SEM useEffect)
   */
  const selectedTop = manualTop ?? tops.find((t) => t.type === "top") ?? null;
  const selectedBottom =
    manualBottom ?? bottoms.find((b) => b.type === "bottom") ?? null;

  /**
   * 🔥 SUGESTÕES
   */
  const suggestions = useMemo<LookSuggestion[]>(() => {
    const result: LookSuggestion[] = [];

    const topSlice = tops.slice(0, 2);
    const bottomSlice = bottoms.slice(0, 2);

    topSlice.forEach((top, topIndex) => {
      bottomSlice.forEach((bottom, bottomIndex) => {
        result.push({
          id: `${top.id}-${bottom.id}`,
          label: `Look ${topIndex + 1}.${bottomIndex + 1}`,
          topId: top.id,
          bottomId: bottom.id,
        });
      });
    });

    return result;
  }, [tops, bottoms]);

  const total = useMemo(() => {
    return (selectedTop?.price ?? 0) + (selectedBottom?.price ?? 0);
  }, [selectedTop, selectedBottom]);

  function handleSelectItem(item: LookItem) {
    if (item.type === "top") {
      setManualTop(item);
      return;
    }

    setManualBottom(item);
  }

  function handleApplySuggestion(topId: string, bottomId: string) {
    const top = tops.find((item) => item.id === topId);
    const bottom = bottoms.find((item) => item.id === bottomId);

    if (!top || !bottom) return;

    setManualTop(top);
    setManualBottom(bottom);
  }

  async function handleAddSingle(item: LookItem) {
    await addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      oldPrice: item.oldPrice,
      image: item.image,
    });
  }

  async function handleAddFullLook() {
    if (!selectedTop || !selectedBottom) return;

    await addItem({
      id: selectedTop.id,
      name: selectedTop.name,
      price: selectedTop.price,
      oldPrice: selectedTop.oldPrice,
      image: selectedTop.image,
    });

    await addItem({
      id: selectedBottom.id,
      name: selectedBottom.name,
      price: selectedBottom.price,
      oldPrice: selectedBottom.oldPrice,
      image: selectedBottom.image,
    });
  }

  if (!selectedTop || !selectedBottom) {
    return (
      <section className="py-24 md:py-32 bg-black">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="max-w-3xl">
            <p className="uppercase text-xs tracking-[0.4em] text-white/50">
              Experiência
            </p>

            <h2 className="mt-5 text-4xl md:text-5xl lg:text-6xl font-light leading-tight">
              <span className="block">Explore e monte seu</span>
              <span className="block bs-title">Look Blackstore</span>
            </h2>

            <p className="mt-6 text-white/60">
              Carregando combinações do look...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-24 md:py-32 bg-black">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="mb-14 md:mb-16 max-w-3xl">
            <p className="uppercase text-xs tracking-[0.4em] text-white/50">
              Experiência
            </p>

            <h2 className="mt-5 text-4xl md:text-5xl lg:text-6xl font-light leading-tight">
              <span className="block">Explore e monte seu</span>
              <span className="block bs-title">Look Blackstore</span>
            </h2>

            <p className="mt-6 text-white/60 max-w-2xl">
              Descubra combinações, selecione cada peça separadamente e monte
              seu look em tempo real.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[0.86fr_1.14fr] gap-10 md:gap-14 items-start">
            <div className="relative max-w-sm md:max-w-md xl:max-w-[460px] mx-auto xl:mx-0 xl:justify-self-start">
              <div className="relative aspect-[4/5] rounded-[28px] overflow-hidden border border-white/10 bg-[#090909]">
                <Image
                  src={selectedTop.image || "/images/placeholder"}
                  alt="Look Blackstore"
                  fill
                  sizes="(max-width:768px) 110vw, 420px"
                  className="object-cover object-center"
                  onError={(e) => {
                    e.currentTarget.src = "/images/placeholder";
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
              </div>

              {[selectedTop, selectedBottom].map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelectItem(item)}
                  className="
                    absolute z-20
                    w-8 h-8 rounded-full
                    border-2 border-[var(--gold)]
                    bg-black/75 backdrop-blur
                    shadow-[0_0_18px_rgba(212,175,55,0.25)]
                    hover:scale-110 active:scale-95
                    transition
                  "
                  style={{
                    top: item.top,
                    left: item.left,
                    transform: "translate(-50%, -50%)",
                  }}
                  aria-label={`Selecionar ${item.name}`}
                >
                  <span className="block w-full h-full rounded-full border border-white/20" />
                </button>
              ))}
            </div>

            <div className="space-y-8">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-5 md:p-7">
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-white/45">
                      Sugestões de combinação
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {suggestions.map((look) => {
                        const isActive =
                          selectedTop.id === look.topId &&
                          selectedBottom.id === look.bottomId;

                        return (
                          <button
                            key={look.id}
                            onClick={() =>
                              handleApplySuggestion(look.topId, look.bottomId)
                            }
                            className={`
                              px-4 py-2 rounded-full text-[10px] md:text-xs uppercase tracking-[0.3em] transition
                              ${
                                isActive
                                  ? "bg-[var(--gold)] text-black"
                                  : "border border-white/15 text-white/70 hover:border-[var(--gold)] hover:text-[var(--gold)]"
                              }
                            `}
                          >
                            {look.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:p-5">
                      <div className="flex items-start gap-4">
                        <div className="relative w-20 h-24 rounded-xl overflow-hidden shrink-0">
                          <Image
                            src={selectedTop.image || "/images/placeholder"}
                            alt={selectedTop.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 420px"
                            className="object-cover object-center"
                            onError={(e) => {
                              e.currentTarget.src = "/images/placeholder";
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.35em] text-white/45">
                            Top
                          </p>

                          <h3 className="mt-2 text-sm md:text-base leading-tight">
                            {selectedTop.name}
                          </h3>

                          <p className="mt-2 text-[var(--gold)] text-sm md:text-base">
                            R$ {selectedTop.price.toFixed(2)}
                          </p>

                          <p className="mt-3 text-xs text-white/60 leading-relaxed">
                            {selectedTop.fabric}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedTop.sizes.map((size) => (
                          <span
                            key={size}
                            className="px-2.5 py-1 text-[10px] uppercase border border-white/15 rounded-md text-white/75"
                          >
                            {size}
                          </span>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() =>
                            setQuickProduct(toQuickProduct(selectedTop))
                          }
                          className="
                            flex-1 inline-flex items-center justify-center gap-2
                            py-2.5 rounded-full border border-white/15
                            text-[10px] uppercase tracking-[0.35em]
                            hover:border-[var(--gold)] hover:text-[var(--gold)]
                            transition
                          "
                        >
                          <Eye size={14} />
                          QuickView
                        </button>

                        <button
                          onClick={() => handleAddSingle(selectedTop)}
                          className="
                            flex-1 inline-flex items-center justify-center gap-2
                            py-2.5 rounded-full bg-[var(--gold)] text-black
                            text-[10px] uppercase tracking-[0.35em]
                            hover:scale-[1.02] active:scale-[0.98]
                            transition
                          "
                        >
                          <ShoppingBag size={14} />
                          Adicionar
                        </button>
                      </div>

                      <Link
                        href={`/product/${selectedTop.slug}`}
                        className="block mt-3 text-[10px] uppercase tracking-[0.35em] text-white/50 hover:text-white transition"
                      >
                        Ver produto completo →
                      </Link>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:p-5">
                      <div className="flex items-start gap-4">
                        <div className="relative w-20 h-24 rounded-xl overflow-hidden shrink-0">
                          <Image
                            src={selectedBottom.image || "/images/placeholder"}
                            alt={selectedBottom.name}
                            fill
                            sizes="(max-width:768px) 100vw, 420px"
                            className="object-cover object-center"
                            onError={(
                              e: React.SyntheticEvent<HTMLImageElement>,
                            ) => {
                              const target = e.currentTarget;
                              target.src = "/images/placeholder";
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.35em] text-white/45">
                            Bottom
                          </p>

                          <h3 className="mt-2 text-sm md:text-base leading-tight">
                            {selectedBottom.name}
                          </h3>

                          <p className="mt-2 text-[var(--gold)] text-sm md:text-base">
                            R$ {selectedBottom.price.toFixed(2)}
                          </p>

                          <p className="mt-3 text-xs text-white/60 leading-relaxed">
                            {selectedBottom.fabric}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedBottom.sizes.map((size) => (
                          <span
                            key={size}
                            className="px-2.5 py-1 text-[10px] uppercase border border-white/15 rounded-md text-white/75"
                          >
                            {size}
                          </span>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() =>
                            setQuickProduct(toQuickProduct(selectedBottom))
                          }
                          className="
                            flex-1 inline-flex items-center justify-center gap-2
                            py-2.5 rounded-full border border-white/15
                            text-[10px] uppercase tracking-[0.35em]
                            hover:border-[var(--gold)] hover:text-[var(--gold)]
                            transition
                          "
                        >
                          <Eye size={14} />
                          QuickView
                        </button>

                        <button
                          onClick={() => handleAddSingle(selectedBottom)}
                          className="
                            flex-1 inline-flex items-center justify-center gap-2
                            py-2.5 rounded-full bg-[var(--gold)] text-black
                            text-[10px] uppercase tracking-[0.35em]
                            hover:scale-[1.02] active:scale-[0.98]
                            transition
                          "
                        >
                          <ShoppingBag size={14} />
                          Adicionar
                        </button>
                      </div>

                      <Link
                        href={`/product/${selectedBottom.slug}`}
                        className="block mt-3 text-[10px] uppercase tracking-[0.35em] text-white/50 hover:text-white transition"
                      >
                        Ver produto completo →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-5 md:p-7">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                  <div>
                    <p className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-white/45">
                      Look selecionado
                    </p>

                    <h3 className="mt-3 text-2xl md:text-3xl font-light leading-tight">
                      <span className="block">{selectedTop.name}</span>
                      <span className="block bs-title">
                        + {selectedBottom.name}
                      </span>
                    </h3>

                    <p className="mt-4 text-white/60 max-w-xl text-sm md:text-base">
                      Escolha cada peça separadamente, visualize os detalhes e
                      adicione o look completo ao carrinho com um clique.
                    </p>
                  </div>

                  <div className="md:text-right">
                    <p className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-white/45">
                      Total do look
                    </p>

                    <p className="mt-2 text-2xl md:text-3xl text-[var(--gold)] font-medium">
                      R$ {total.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleAddFullLook}
                    className="
                      flex-1 inline-flex items-center justify-center gap-2
                      py-4 rounded-full bg-[var(--gold)] text-black
                      text-[10px] md:text-xs uppercase tracking-[0.35em]
                      hover:scale-[1.02] active:scale-[0.98]
                      transition
                    "
                  >
                    <ShoppingBag size={16} />
                    Comprar look completo
                  </button>

                  <button
                    onClick={() => setQuickProduct(toQuickProduct(selectedTop))}
                    className="
                      flex-1 inline-flex items-center justify-center gap-2
                      py-4 rounded-full border border-white/15
                      text-[10px] md:text-xs uppercase tracking-[0.35em]
                      hover:border-[var(--gold)] hover:text-[var(--gold)]
                      transition
                    "
                  >
                    <Eye size={16} />
                    Ver peça em destaque
                  </button>
                </div>
              </div>
            </div>
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
