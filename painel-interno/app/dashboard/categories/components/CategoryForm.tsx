"use client";

import { FormEvent, useMemo, useState } from "react";
import { Category } from "../types/types";

type CategoryFormData = {
  name: string;
  slug: string;
};

type Props = {
  editing: Category | null;
  onSave: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
};

type FormState = {
  name: string;
  slug: string;
};

function generateSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export default function CategoryForm({
  editing,
  onSave,
  onCancel,
}: Props) {
  const isEditing = useMemo(() => Boolean(editing), [editing]);

  const [form, setForm] = useState<FormState>(() => ({
    name: editing?.name ?? "",
    slug: editing?.slug ?? "",
  }));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  function handleNameChange(value: string): void {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: isEditing ? prev.slug : generateSlug(value),
    }));
  }

  function handleSlugChange(value: string): void {
    setForm((prev) => ({
      ...prev,
      slug: generateSlug(value),
    }));
  }

  function resetForm(): void {
    setForm({
      name: "",
      slug: "",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const trimmedName = form.name.trim();
    const trimmedSlug = form.slug.trim();

    if (!trimmedName) {
      alert("O nome da categoria é obrigatório.");
      return;
    }

    if (!trimmedSlug) {
      alert("O slug da categoria é obrigatório.");
      return;
    }

    try {
      setIsSubmitting(true);

      await onSave({
        name: trimmedName,
        slug: generateSlug(trimmedSlug),
      });

      if (!isEditing) {
        resetForm();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="
        relative overflow-hidden rounded-[28px] border border-white/10
        bg-[rgba(0,0,0,0.35)] backdrop-blur-xl
        p-5 sm:p-6 lg:p-8
        shadow-[0_20px_80px_rgba(0,0,0,0.35)]
      "
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.10),transparent_35%),radial-gradient(circle_at_left_center,rgba(228,163,181,0.08),transparent_30%)] pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">
              Gestão de categorias
            </p>

            <h2 className="mt-2 text-2xl sm:text-3xl font-light leading-tight">
              {isEditing ? (
                <>
                  Editando <span className="bs-title">categoria</span>
                </>
              ) : (
                <>
                  Nova <span className="bs-title">categoria</span>
                </>
              )}
            </h2>

            <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/60 leading-relaxed">
              Organize a vitrine da loja com nomes claros, slug padronizado e
              estrutura visual consistente para o catálogo.
            </p>
          </div>

          {isEditing && (
            <span className="inline-flex w-fit items-center rounded-full border border-[var(--gold)]/25 bg-[rgba(212,175,55,0.10)] px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-[var(--gold)]">
              Modo edição
            </span>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-5">
          <label className="block">
            <span className="mb-3 block text-[11px] uppercase tracking-[0.32em] text-white/55">
              Nome da categoria
            </span>

            <input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex.: Moda Fitness"
              disabled={isSubmitting}
              className="
                w-full rounded-2xl border border-white/10 bg-white/[0.04]
                px-4 py-3.5 text-sm text-white placeholder:text-white/30
                outline-none transition
                focus:border-[var(--gold)]/60
                focus:bg-white/[0.06]
                focus:shadow-[0_0_0_4px_rgba(212,175,55,0.10)]
                disabled:cursor-not-allowed disabled:opacity-60
              "
            />
          </label>

          <label className="block">
            <span className="mb-3 block text-[11px] uppercase tracking-[0.32em] text-white/55">
              Slug
            </span>

            <input
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="moda-fitness"
              disabled={isSubmitting}
              className="
                w-full rounded-2xl border border-white/10 bg-white/[0.04]
                px-4 py-3.5 text-sm text-white placeholder:text-white/30
                outline-none transition
                focus:border-[var(--gold)]/60
                focus:bg-white/[0.06]
                focus:shadow-[0_0_0_4px_rgba(212,175,55,0.10)]
                disabled:cursor-not-allowed disabled:opacity-60
              "
            />
          </label>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="
              inline-flex items-center justify-center rounded-full
              bg-[var(--gold)] px-7 py-3.5 text-xs font-medium uppercase
              tracking-[0.28em] text-black transition
              hover:scale-[1.02] hover:shadow-[0_12px_35px_rgba(212,175,55,0.28)]
              disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100
            "
          >
            {isSubmitting
              ? "Salvando..."
              : isEditing
                ? "Atualizar categoria"
                : "Criar categoria"}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="
                inline-flex items-center justify-center rounded-full
                border border-white/15 bg-white/[0.03]
                px-7 py-3.5 text-xs uppercase tracking-[0.28em] text-white/80
                transition hover:border-white/30 hover:bg-white/[0.06]
                disabled:cursor-not-allowed disabled:opacity-60
              "
            >
              Cancelar edição
            </button>
          )}
        </div>
      </div>
    </form>
  );
}