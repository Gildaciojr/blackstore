"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ui/ProductCard";
import Reveal from "@/components/ui/Reveal";
import ProductQuickView, {
  Product as QuickProduct,
} from "@/components/ui/ProductQuickView";
import { Search } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Variant = {
  id: string;
  size: string;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number | null;
  image: string;
  images?: string[];
  categoryId: string;
  stock: number;
  variants?: Variant[];
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const [selectedProduct, setSelectedProduct] = useState<QuickProduct | null>(
    null,
  );

  useEffect(() => {
    async function loadData() {
      const [productsData, categoriesData] = await Promise.all([
        apiFetch<Product[]>("/products"),
        apiFetch<Category[]>("/categories"),
      ]);

      setProducts(productsData);
      setCategories(categoriesData);
    }

    loadData();
  }, []);

  function resolveImage(url: string) {
    if (!url) return "";
    if (url.startsWith("/images")) return url;
    if (url.startsWith("http")) return url;
    return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
  }

  async function handleSearch(value: string) {
    setQuery(value);

    if (!value) {
      const productsData = await apiFetch<Product[]>("/products");
      setProducts(productsData);
      return;
    }

    const results = await apiFetch<Product[]>(`/search?q=${value}`);
    setProducts(results);
  }

  const filtered = products.filter((p) => {
    if (category === "all") return true;

    const cat = categories.find((c) => c.slug === category);
    if (!cat) return true;

    return p.categoryId === cat.id;
  });

  return (
    <main className="pt-16 pb-28 bg-[#0b0b0d] min-h-screen">
      <div className="max-w-[1500px] mx-auto px-4 md:px-8">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8 md:mb-10">
          <div>
            <p className="uppercase text-[10px] md:text-xs tracking-[0.35em] text-white/40">
              coleção
            </p>

            <h1 className="mt-2 text-3xl md:text-4xl font-light">
              <span className="text-white">Catálogo </span>
              <span className="bs-title">Blackstore</span>
            </h1>

            <p className="mt-3 text-white/60 max-w-xl text-xs md:text-sm">
              Moda fitness e vestidos premium pensados para mulheres que
              valorizam presença, design e autenticidade.
            </p>
          </div>

          {/* SEARCH */}
          <div className="relative w-full lg:w-[320px]">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />

            <input
              type="text"
              placeholder="Buscar produto..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="
                w-full
                pl-10 pr-4 py-3 md:py-4
                rounded-full
                bg-black
                border border-white/10
                text-sm
                text-white/80
                placeholder:text-white/30
                focus:outline-none
                focus:border-[var(--gold)]
                transition-colors
              "
            />
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 md:mb-12 overflow-hidden">
          <div className="text-[10px] md:text-xs tracking-[0.35em] uppercase text-white/40 whitespace-nowrap shrink-0">
            {filtered.length} produtos
          </div>

          {/* 🔥 CATEGORIAS COM SCROLL HORIZONTAL NATIVO (App Feel) */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x w-full md:w-auto">
            <button
              onClick={() => setCategory("all")}
              className={`px-5 py-2.5 rounded-full border whitespace-nowrap snap-start transition text-xs md:text-sm ${
                category === "all"
                  ? "bg-[var(--gold)] border-[var(--gold)] text-black font-semibold"
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
              }`}
            >
              Todos
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.slug)}
                className={`px-5 py-2.5 rounded-full border whitespace-nowrap snap-start transition text-xs md:text-sm ${
                  category === cat.slug
                    ? "bg-[var(--gold)] border-[var(--gold)] text-black font-semibold"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* EMPTY STATE */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search size={48} className="text-white/20 mb-4" />
            <p className="text-white/50 text-sm md:text-base">
              Nenhum produto encontrado para esta busca ou categoria.
            </p>
            <button
              onClick={() => {
                setQuery("");
                setCategory("all");
                handleSearch("");
              }}
              className="mt-6 px-6 py-2 text-xs tracking-widest uppercase border border-white/20 rounded-full hover:bg-white/5 transition"
            >
              Limpar Filtros
            </button>
          </div>
        )}

        {/* GRID 🔥 AJUSTADO PARA MOBILE (gap-x-3) E DESKTOP (gap-x-8) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 md:gap-x-8 gap-y-8 md:gap-y-14">
          {filtered.map((product, index) => {
            const imageUrl = resolveImage(product.image);

            const totalStock =
              product.variants && product.variants.length > 0
                ? product.variants.reduce((acc, v) => acc + v.stock, 0)
                : product.stock;

            return (
              <Reveal key={product.id} delay={index * 0.05}>
                <ProductCard
                  id={product.id}
                  slug={product.slug}
                  image={imageUrl}
                  name={product.name}
                  price={product.price}
                  stock={totalStock}
                  onQuickView={() =>
                    setSelectedProduct({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: imageUrl,
                      images: product.images,
                      oldPrice: product.oldPrice ?? undefined,
                      variants: product.variants,
                    })
                  }
                />
              </Reveal>
            );
          })}
        </div>
      </div>

      {selectedProduct && (
        <ProductQuickView
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </main>
  );
}
