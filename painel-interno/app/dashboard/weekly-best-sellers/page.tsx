"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Product = {
  id: string;
  name: string;
};

type RankingItem = {
  position: number;
  productId: string;
};

type WeeklyBestSellerResponse = {
  id: string;
  position: number;
  productId: string;
};

export default function WeeklyBestSellersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([
    { position: 1, productId: "" },
    { position: 2, productId: "" },
    { position: 3, productId: "" },
    { position: 4, productId: "" },
  ]);

  const [loading, setLoading] = useState(false);

  // 🔥 carregar produtos
  useEffect(() => {
    async function loadProducts() {
      const data = await apiFetch<Product[]>("/products");
      setProducts(data);
    }

    loadProducts();
  }, []);

  // 🔥 carregar ranking atual
  useEffect(() => {
    async function loadRanking() {
      try {
        const data = await apiFetch<WeeklyBestSellerResponse[]>("/weekly-best-sellers");

        if (!data || data.length === 0) return;

        const formatted = data.map((item) => ({
          position: item.position,
          productId: item.productId,
        }));

        setRanking(formatted);
      } catch {
        // silencioso
      }
    }

    loadRanking();
  }, []);

  // 🔥 alterar seleção
  function handleChange(position: number, productId: string) {
    setRanking((prev) =>
      prev.map((item) =>
        item.position === position ? { ...item, productId } : item,
      ),
    );
  }

  // 🔥 salvar ranking
  async function handleSave() {
    setLoading(true);

    try {
      // validação front (evita erro backend)
      const hasEmpty = ranking.some((r) => !r.productId);

      if (hasEmpty) {
        alert("Preencha todas as posições");
        return;
      }

      const ids = ranking.map((r) => r.productId);
      const unique = new Set(ids);

      if (unique.size !== 4) {
        alert("Não pode repetir produtos");
        return;
      }

      await apiFetch("/weekly-best-sellers", {
        method: "POST",
        body: JSON.stringify(ranking),
      });

      alert("Ranking salvo com sucesso");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar ranking");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-8">Mais vendidos da semana</h1>

      <div className="space-y-6">
        {ranking.map((item) => (
          <div
            key={item.position}
            className="flex flex-col sm:flex-row sm:items-center gap-4"
          >
            {/* posição */}
            <div
              className="
              w-12 h-12 rounded-full
              bg-[var(--gold)] text-black
              flex items-center justify-center
              text-sm font-semibold
            "
            >
              {String(item.position).padStart(2, "0")}
            </div>

            {/* select */}
            <select
              value={item.productId}
              onChange={(e) => handleChange(item.position, e.target.value)}
              className="
                w-full
                bg-[#0b0b0d]
                border border-white/10
                px-4 py-3 rounded-xl
                text-white
              "
            >
              <option value="">Selecione um produto</option>

              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* botão */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="
          mt-10 px-6 py-3 rounded-xl
          bg-[var(--gold)] text-black
          font-medium
          hover:scale-[1.03]
          transition
        "
      >
        {loading ? "Salvando..." : "Salvar ranking"}
      </button>
    </div>
  );
}
