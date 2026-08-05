"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, ShoppingBag, Sparkles, Check, ChevronDown, X } from "lucide-react";
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

  const [manualTop, setManualTop] = useState<LookItem | null>(null);
  const [manualBottom, setManualBottom] = useState<LookItem | null>(null);
  const [quickProduct, setQuickProduct] = useState<QuickProduct | null>(null);
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Estado para modal/drawer de troca de peça ao clicar nos hotspots
  const [selectingType, setSelectingType] = useState<LookItemType | null>(null);

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

  const selectedTop = manualTop ?? tops.find((t) => t.type === "top") ?? null;
  const selectedBottom =
    manualBottom ?? bottoms.find((b) => b.type === "bottom") ?? null;

  // 🔥 GERAÇÃO DE EXATAMENTE 4 LOOKS DISTINTOS
  const suggestions = useMemo<LookSuggestion[]>(() => {
    const result: LookSuggestion[] = [];
    if (tops.length === 0 || bottoms.length === 0) return result;

    for (let i = 0; i < 4; i++) {
      const top = tops[i % tops.length];
      const bottom = bottoms[(i + 1) % bottoms.length];
      
      // Evita duplicatas exatas na lista de 4
      if (!result.some((s) => s.topId === top.id && s.bottomId === bottom.id)) {
        result.push({
          id: `look-${i}-${top.id}-${bottom.id}`,
          label: `Look 0${i + 1}`,
          topId: top.id,
          bottomId: bottom.id,
        });
      }
    }

    // Garante que sempre teremos 4 opções se houver estoque
    while (result.length < 4 && tops.length > 0 && bottoms.length > 0) {
      const idx = result.length;
      const top = tops[idx % tops.length];
      const bottom = bottoms[idx % bottoms.length];
      result.push({
        id: `look-fallback-${idx}-${top.id}-${bottom.id}`,
        label: `Look 0${result.length + 1}`,
        topId: top.id,
        bottomId: bottom.id,
      });
    }

    return result.slice(0, 4);
  }, [tops, bottoms]);

  const total = useMemo(() => {
    return (selectedTop?.price ?? 0) + (selectedBottom?.price ?? 0);
  }, [selectedTop, selectedBottom]);

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

    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2500);
  }

  if (!selectedTop || !selectedBottom) {
    return (
      <section className="relative py-24 md:py-32 bg-black">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="max-w-3xl">
            <p className="uppercase text-[10px] tracking-[0.4em] text-[var(--gold)] font-semibold">
              Experiência
            </p>
            <h2 className="mt-4 text-3xl md:text-5xl font-light leading-tight">
              <span className="block text-white">Explore e monte seu</span>
              <span className="block bs-title">Look Blackstore</span>
            </h2>
            <p className="mt-6 text-white/50 text-sm tracking-wider animate-pulse">
              Carregando combinações do look...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="relative z-10 py-24 md:py-32 bg-black overflow-hidden">
        {/* Glow de fundo sutil */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--gold)] opacity-[0.03] blur-[160px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
          
          {/* CABEÇALHO DA SEÇÃO */}
          <div className="mb-14 md:mb-16 max-w-3xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-8 bg-[var(--gold)]/60" />
              <p className="text-[10px] tracking-[0.45em] uppercase text-[var(--gold)] font-semibold flex items-center gap-1.5">
                <Sparkles size={12} /> Styling Interativo
              </p>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-tight">
              <span className="block text-white">Explore e monte seu</span>
              <span className="block bs-title">Look Blackstore</span>
            </h2>

            <p className="mt-4 text-white/60 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed">
              Toque nos pontos interativos na foto ou escolha um dos 4 looks exclusivos para alternar as peças em tempo real.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[0.88fr_1.12fr] gap-10 md:gap-14 items-start">
            
            {/* IMAGEM DO LOOK COM PONTOS INTERATIVOS (HOTSPOTS) CLICÁVEIS */}
            <div className="relative max-w-sm md:max-w-md xl:max-w-[460px] mx-auto xl:mx-0 w-full">
              <div className="relative aspect-[4/5] rounded-[28px] overflow-hidden border border-white/10 bg-neutral-950 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
                <Image
                  src={selectedTop.image || "/images/placeholder"}
                  alt="Look Blackstore"
                  fill
                  sizes="(max-width:768px) 100vw, 460px"
                  className="object-cover object-center transition-all duration-700"
                  onError={(e) => {
                    e.currentTarget.src = "/images/placeholder";
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                {/* Badge informativa na imagem */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center justify-between text-xs text-white/80">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--gold)]">Toque para trocar peça</span>
                  <span className="font-mono text-[10px]">✨ Interativo</span>
                </div>
              </div>

              {/* 🔥 HOTSPOTS INTERATIVOS REAIS (ABREM SELETOR DE PEÇAS) */}
              {[
                { item: selectedTop, type: "top" as LookItemType, label: "Trocar Top" },
                { item: selectedBottom, type: "bottom" as LookItemType, label: "Trocar Bottom" }
              ].map(({ item, type }) => (
                <button
                  key={`${type}-${item.id}`}
                  onClick={() => setSelectingType(type)}
                  className="
                    absolute z-20
                    px-3.5 py-2 rounded-full
                    border-2 border-[var(--gold)]
                    bg-black/85 backdrop-blur-xl
                    shadow-[0_0_20px_rgba(212,175,55,0.4)]
                    hover:scale-105 active:scale-95
                    transition-all duration-300
                    flex items-center gap-2
                    group
                  "
                  style={{
                    top: item.top,
                    left: item.left,
                    transform: "translate(-50%, -50%)",
                  }}
                  aria-label={`Trocar ${type}`}
                >
                  <span className="w-2 h-2 rounded-full bg-[var(--gold)] animate-pulse" />
                  <span className="text-[9px] uppercase tracking-widest text-white font-medium whitespace-nowrap">
                    {type === "top" ? "Top ✦" : "Bottom ✦"}
                  </span>
                </button>
              ))}
            </div>

            {/* PAINEL DE CONFIGURAÇÃO E DETALHES DAS PEÇAS */}
            <div className="space-y-6 md:space-y-8">
              
              {/* CARD DE 4 SUGESTÕES DE LOOKS */}
              <div className="rounded-[24px] border border-white/10 bg-white/[0.02] backdrop-blur-xl p-5 md:p-6 shadow-xl">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-white/40 font-medium">
                    Sugestões de Looks Exclusivos (4 Opções)
                  </p>

                  <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                            py-2.5 px-3 rounded-xl text-[10px] uppercase tracking-[0.2em] transition-all duration-300 text-center
                            ${
                              isActive
                                ? "bg-[var(--gold)] text-black font-bold shadow-lg scale-105"
                                : "border border-white/15 text-white/70 hover:border-[var(--gold)] hover:text-white bg-black/40"
                            }
                          `}
                        >
                          {look.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* GRID DOS DETALHES DE CADA PEÇA (TOP & BOTTOM) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* TOP ITEM */}
                <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 md:p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-4">
                      <div 
                        onClick={() => setSelectingType("top")}
                        className="relative w-20 h-24 rounded-xl overflow-hidden shrink-0 border border-white/10 cursor-pointer group"
                      >
                        <Image
                          src={selectedTop.image || "/images/placeholder"}
                          alt={selectedTop.name}
                          fill
                          sizes="80px"
                          className="object-cover object-center group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.currentTarget.src = "/images/placeholder";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] uppercase tracking-wider text-[var(--gold)] font-bold">
                          Trocar
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] uppercase tracking-[0.35em] text-[var(--gold)] font-medium">
                            Parte Superior
                          </p>
                          <button 
                            onClick={() => setSelectingType("top")}
                            className="text-[9px] uppercase tracking-wider text-[var(--gold)] underline underline-offset-2"
                          >
                            Mudar
                          </button>
                        </div>

                        <h3 className="mt-1 text-xs md:text-sm font-medium leading-snug text-white truncate">
                          {selectedTop.name}
                        </h3>

                        <p className="mt-1.5 text-[var(--gold)] text-sm font-bold">
                          R$ {selectedTop.price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3.5 text-xs text-white/60 leading-relaxed line-clamp-2">
                      {selectedTop.fabric}
                    </p>

                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {selectedTop.sizes.map((size) => (
                        <span
                          key={size}
                          className="px-2 py-0.5 text-[9px] uppercase border border-white/15 rounded text-white/70"
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2">
                    <button
                      onClick={() =>
                        setQuickProduct(toQuickProduct(selectedTop))
                      }
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/15 text-[9px] uppercase tracking-[0.25em] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors"
                    >
                      <Eye size={13} /> Ver
                    </button>

                    <button
                      onClick={() => handleAddSingle(selectedTop)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[var(--gold)] text-black text-[9px] uppercase tracking-[0.25em] font-bold hover:scale-[1.02] active:scale-98 transition-all"
                    >
                      <ShoppingBag size={13} /> Adicionar
                    </button>
                  </div>
                </div>

                {/* BOTTOM ITEM */}
                <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 md:p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-4">
                      <div 
                        onClick={() => setSelectingType("bottom")}
                        className="relative w-20 h-24 rounded-xl overflow-hidden shrink-0 border border-white/10 cursor-pointer group"
                      >
                        <Image
                          src={selectedBottom.image || "/images/placeholder"}
                          alt={selectedBottom.name}
                          fill
                          sizes="80px"
                          className="object-cover object-center group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.currentTarget.src = "/images/placeholder";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] uppercase tracking-wider text-[var(--gold)] font-bold">
                          Trocar
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] uppercase tracking-[0.35em] text-[var(--gold)] font-medium">
                            Parte Inferior
                          </p>
                          <button 
                            onClick={() => setSelectingType("bottom")}
                            className="text-[9px] uppercase tracking-wider text-[var(--gold)] underline underline-offset-2"
                          >
                            Mudar
                          </button>
                        </div>

                        <h3 className="mt-1 text-xs md:text-sm font-medium leading-snug text-white truncate">
                          {selectedBottom.name}
                        </h3>

                        <p className="mt-1.5 text-[var(--gold)] text-sm font-bold">
                          R$ {selectedBottom.price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3.5 text-xs text-white/60 leading-relaxed line-clamp-2">
                      {selectedBottom.fabric}
                    </p>

                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {selectedBottom.sizes.map((size) => (
                        <span
                          key={size}
                          className="px-2 py-0.5 text-[9px] uppercase border border-white/15 rounded text-white/70"
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2">
                    <button
                      onClick={() =>
                        setQuickProduct(toQuickProduct(selectedBottom))
                      }
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/15 text-[9px] uppercase tracking-[0.25em] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors"
                    >
                      <Eye size={13} /> Ver
                    </button>

                    <button
                      onClick={() => handleAddSingle(selectedBottom)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[var(--gold)] text-black text-[9px] uppercase tracking-[0.25em] font-bold hover:scale-[1.02] active:scale-98 transition-all"
                    >
                      <ShoppingBag size={13} /> Adicionar
                    </button>
                  </div>
                </div>

              </div>

              {/* CARD RESUMO FINAL DO LOOK COMPLETO */}
              <div className="rounded-[24px] border border-[var(--gold)]/30 bg-gradient-to-br from-white/[0.03] via-[#1a1408]/30 to-black p-5 md:p-7 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--gold)] font-medium">
                      Look Completo Selecionado
                    </p>

                    <h3 className="mt-2 text-xl md:text-2xl font-light leading-tight text-white">
                      <span>{selectedTop.name}</span>
                      <span className="block text-[var(--gold)] font-normal text-lg">
                        + {selectedBottom.name}
                      </span>
                    </h3>
                  </div>

                  <div className="md:text-right">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-white/40">
                      Valor do Conjunto
                    </p>
                    <p className="mt-1 text-2xl md:text-3xl text-[var(--gold)] font-bold">
                      R$ {total.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3.5">
                  <button
                    onClick={handleAddFullLook}
                    className={`
                      flex-1 inline-flex items-center justify-center gap-2.5
                      py-3.5 rounded-full text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold transition-all duration-300 shadow-xl
                      ${
                        addedFeedback
                          ? "bg-emerald-500 text-black"
                          : "bg-[var(--gold)] text-black hover:scale-[1.02] active:scale-95"
                      }
                    `}
                  >
                    {addedFeedback ? (
                      <>
                        <Check size={16} className="stroke-[3]" /> Look Adicionado com Sucesso!
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} /> Comprar Look Completo
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setQuickProduct(toQuickProduct(selectedTop))}
                    className="
                      inline-flex items-center justify-center gap-2
                      px-6 py-3.5 rounded-full border border-white/20
                      text-[10px] md:text-xs uppercase tracking-[0.3em] text-white/80
                      hover:bg-white/10 hover:border-white/50 transition-all
                    "
                  >
                    <Eye size={15} /> Inspeção Rápida
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 🔥 MODAL / DRAWER INTERATIVO PARA ESCOLHER PEÇAS AO CLICAR NOS HOTSPOTS */}
      {selectingType && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-neutral-950 border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--gold)]">
                  Seleção interativa
                </p>
                <h3 className="text-lg md:text-xl font-light text-white mt-1">
                  Escolha {selectingType === "top" ? "a Parte Superior (Top)" : "a Parte Inferior (Bottom)"}
                </h3>
              </div>

              <button
                onClick={() => setSelectingType(null)}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {(selectingType === "top" ? tops : bottoms).map((piece) => {
                const isSelected =
                  (selectingType === "top" && selectedTop.id === piece.id) ||
                  (selectingType === "bottom" && selectedBottom.id === piece.id);

                return (
                  <div
                    key={piece.id}
                    onClick={() => {
                      if (selectingType === "top") setManualTop(piece);
                      else setManualBottom(piece);
                      setSelectingType(null);
                    }}
                    className={`
                      flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all
                      ${
                        isSelected
                          ? "border-[var(--gold)] bg-[var(--gold)]/10 shadow-[0_0_20px_rgba(212,175,55,0.15)]"
                          : "border-white/10 bg-black/40 hover:border-white/30 hover:bg-black/70"
                      }
                    `}
                  >
                    <div className="relative w-16 h-20 rounded-xl overflow-hidden shrink-0 border border-white/10">
                      <Image
                        src={piece.image}
                        alt={piece.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{piece.name}</h4>
                      <p className="text-[var(--gold)] font-bold text-sm mt-1">R$ {piece.price.toFixed(2)}</p>
                      <p className="text-xs text-white/50 truncate mt-1">{piece.fabric}</p>
                    </div>

                    {isSelected && (
                      <span className="px-3 py-1 rounded-full bg-[var(--gold)] text-black text-[9px] uppercase tracking-widest font-bold">
                        Selecionado
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {quickProduct && (
        <ProductQuickView
          product={quickProduct}
          onClose={() => setQuickProduct(null)}
        />
      )}
    </>
  );
}