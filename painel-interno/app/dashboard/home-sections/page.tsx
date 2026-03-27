"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Product } from "../products/types/types";

type SectionType = "HERO" | "LAUNCHES" | "PROMOTIONS";

type SelectedItem = {
  productId: string;
  position: number;
};

type HomeSectionItem = {
  position: number;
  product: Product;
};

type HomeResponse = {
  hero: HomeSectionItem[];
  launches: HomeSectionItem[];
  promotions: HomeSectionItem[];
};

export default function HomeSectionsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [section, setSection] = useState<SectionType>("HERO");

  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function resolveImage(url: string): string {
    if (!url) return "";

    if (url.startsWith("http")) return url;

    if (url.startsWith("/uploads")) {
      return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
    }

    return url;
  }

  async function loadData(): Promise<void> {
    setLoading(true);

    try {
      const [productsData, homeData] = await Promise.all([
        apiFetch<Product[]>("/products"),
        apiFetch<HomeResponse>("/home"),
      ]);

      setProducts(productsData);

      let currentSection: HomeSectionItem[] = [];

      if (section === "HERO") {
        currentSection = homeData.hero;
      } else if (section === "LAUNCHES") {
        currentSection = homeData.launches;
      } else if (section === "PROMOTIONS") {
        currentSection = homeData.promotions;
      }

      if (currentSection && currentSection.length > 0) {
        setSelected(
          currentSection.map((item) => ({
            productId: item.product.id,
            position: item.position,
          })),
        );
      } else {
        setSelected([]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [section]);

  function toggleProduct(productId: string) {
    setSelected((prev) => {
      const exists = prev.find((p) => p.productId === productId);

      if (exists) {
        return prev.filter((p) => p.productId !== productId);
      }

      return [
        ...prev,
        {
          productId,
          position: prev.length + 1,
        },
      ];
    });
  }

  function moveItem(productId: string, direction: "up" | "down") {
    setSelected((prev) => {
      const index = prev.findIndex((p) => p.productId === productId);
      if (index === -1) return prev;

      const newArr = [...prev];

      const swapIndex = direction === "up" ? index - 1 : index + 1;

      if (swapIndex < 0 || swapIndex >= prev.length) return prev;

      [newArr[index], newArr[swapIndex]] = [newArr[swapIndex], newArr[index]];

      return newArr.map((item, i) => ({
        ...item,
        position: i + 1,
      }));
    });
  }

  async function handleSave(): Promise<void> {
    try {
      setSaving(true);
      setMessage(null);
      setErrorMessage(null);

      const payload: { productId: string; position: number }[] = selected.map(
        (item, index) => ({
          productId: item.productId,
          position: index + 1,
        }),
      );

      const response = await apiFetch<{ count: number }>(
        `/admin/home-sections/${section}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      /**
       * 🔥 VALIDAÇÃO PROFISSIONAL DA RESPOSTA
       */
      if (!response || typeof response.count !== "number") {
        throw new Error("Resposta inválida do servidor");
      }

      setMessage(`Seção salva com sucesso (${response.count} itens)`);
    } catch (error) {
      console.error("❌ Erro ao salvar seção", {
        section,
        error,
      });

      setErrorMessage("Erro ao salvar. Verifique o servidor.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Carregando...</p>;

  return (
    <section className="space-y-10 max-w-6xl mx-auto py-10">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-light">Curadoria da Home</h1>
        <p className="text-white/50 text-sm mt-2">
          Selecione produtos para cada seção do site
        </p>
      </div>

      {/* SELECT SECTION */}
      <div className="flex gap-3">
        {["HERO", "LAUNCHES", "PROMOTIONS"].map((type) => (
          <button
            key={type}
            onClick={() => setSection(type as SectionType)}
            className={`
              px-4 py-2 rounded-full text-xs tracking-[0.2em]
              border transition
              ${
                section === type
                  ? "border-[var(--gold)] text-[var(--gold)]"
                  : "border-white/20 text-white/50"
              }
            `}
          >
            {type}
          </button>
        ))}
      </div>

      {/* LISTA DE PRODUTOS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => {
          const isSelected = selected.some((s) => s.productId === p.id);

          return (
            <div
              key={p.id}
              onClick={() => toggleProduct(p.id)}
              className={`
                cursor-pointer
                border rounded-xl p-3
                transition
                ${
                  isSelected
                    ? "border-[var(--gold)] bg-white/[0.05]"
                    : "border-white/10"
                }
              `}
            >
              <img
                src={resolveImage(p.image)}
                className="w-full h-32 object-cover rounded-lg"
              />

              <p className="text-sm mt-2">{p.name}</p>
            </div>
          );
        })}
      </div>

      {/* ORDEM */}
      <div className="space-y-3">
        <h2 className="text-sm uppercase text-white/40">Ordem da seção</h2>

        {selected.map((item, index) => {
          const product = products.find((p) => p.id === item.productId);

          if (!product) return null;

          return (
            <div
              key={item.productId}
              className="flex items-center justify-between border border-white/10 p-3 rounded-lg"
            >
              <span>{product.name}</span>

              <div className="flex gap-2">
                <button onClick={() => moveItem(item.productId, "up")}>
                  ↑
                </button>

                <button onClick={() => moveItem(item.productId, "down")}>
                  ↓
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FEEDBACK */}
      {message && <div className="text-green-400 text-sm">{message}</div>}

      {errorMessage && (
        <div className="text-red-400 text-sm">{errorMessage}</div>
      )}

      {/* SAVE */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="
    bg-[var(--gold)]
    text-black
    px-6 py-3
    rounded-full
    transition
    disabled:opacity-50
    disabled:cursor-not-allowed
  "
      >
        {saving ? "Salvando..." : "Salvar seção"}
      </button>
    </section>
  );
}
