"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import CategoryForm from "./components/CategoryForm";
import CategoryTable from "./components/CategoryTable";
import { Category } from "./types/types";

type CategoryPayload = {
  name: string;
  slug: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  async function loadCategories(): Promise<void> {
    try {
      setIsLoading(true);
      const data = await apiFetch<Category[]>("/categories");
      setCategories(data);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  async function handleSave(data: CategoryPayload): Promise<void> {
    if (editing) {
      await apiFetch(`/admin/categories/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    } else {
      await apiFetch("/admin/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });
    }

    setEditing(null);
    await loadCategories();
  }

  async function handleDelete(id: string): Promise<void> {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta categoria?"
    );

    if (!confirmed) {
      return;
    }

    await apiFetch(`/admin/categories/${id}`, {
      method: "DELETE",
    });

    if (editing?.id === id) {
      setEditing(null);
    }

    await loadCategories();
  }

  function handleCancelEdit(): void {
    setEditing(null);
  }

  return (
    <section className="space-y-8 sm:space-y-10 px-4 sm:px-6 lg:px-0">
      <div className="relative overflow-hidden rounded-[24px] sm:rounded-[30px] border border-white/10 bg-[rgba(0,0,0,0.28)] p-5 sm:p-8 lg:p-10 backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(228,163,181,0.10),transparent_28%),radial-gradient(circle_at_right_center,rgba(212,175,55,0.12),transparent_30%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.32em] sm:tracking-[0.4em] text-white/45">
              Catálogo Blackstore
            </p>

            <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-light leading-tight break-words">
              Gestão de <span className="bs-title">categorias</span>
            </h1>

            <p className="mt-4 max-w-3xl text-sm sm:text-base text-white/60 leading-relaxed">
              Estruture a navegação da loja com categorias bem definidas,
              slugs consistentes e uma organização visual mais sofisticada para
              a operação do e-commerce.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 w-full lg:w-auto lg:justify-end">
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.24em] text-white/55 text-center sm:text-left">
              {categories.length} categoria{categories.length !== 1 ? "s" : ""}
            </div>

            {editing && (
              <div className="rounded-full border border-[var(--gold)]/25 bg-[rgba(212,175,55,0.08)] px-4 py-2 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.24em] text-[var(--gold)] text-center sm:text-left">
                Editando agora
              </div>
            )}
          </div>
        </div>
      </div>

      <CategoryForm
        editing={editing}
        onSave={handleSave}
        onCancel={handleCancelEdit}
      />

      {isLoading ? (
        <div
          className="
            rounded-[24px] sm:rounded-[28px] border border-white/10
            bg-[rgba(0,0,0,0.35)] backdrop-blur-xl
            p-6 sm:p-10
          "
        >
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] sm:tracking-[0.35em] text-white/40">
            Carregando
          </p>

          <h2 className="mt-4 text-xl sm:text-2xl font-light leading-tight">
            Buscando <span className="bs-title">categorias</span>
          </h2>

          <div className="mt-8 grid gap-4">
            <div className="h-16 rounded-2xl bg-white/[0.08] animate-pulse" />
            <div className="h-16 rounded-2xl bg-white/[0.08] animate-pulse" />
            <div className="h-16 rounded-2xl bg-white/[0.08] animate-pulse" />
          </div>
        </div>
      ) : (
        <CategoryTable
          categories={categories}
          onEdit={setEditing}
          onDelete={handleDelete}
        />
      )}
    </section>
  );
}