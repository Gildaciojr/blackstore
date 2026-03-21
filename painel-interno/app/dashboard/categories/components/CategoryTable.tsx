"use client";

import { Category } from "../types/types";

type Props = {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
};

export default function CategoryTable({
  categories,
  onEdit,
  onDelete,
}: Props) {
  if (categories.length === 0) {
    return (
      <div
        className="
          rounded-[28px] border border-white/10
          bg-[rgba(0,0,0,0.35)] backdrop-blur-xl
          p-8 sm:p-10 text-center
        "
      >
        <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">
          Categorias
        </p>

        <h3 className="mt-4 text-2xl font-light">
          Nenhuma <span className="bs-title">categoria</span> cadastrada
        </h3>

        <p className="mt-3 text-sm sm:text-base text-white/55 max-w-xl mx-auto leading-relaxed">
          Assim que você criar a primeira categoria, ela aparecerá aqui com
          ações rápidas de edição e exclusão.
        </p>
      </div>
    );
  }

  return (
    <div
      className="
        overflow-hidden rounded-[28px] border border-white/10
        bg-[rgba(0,0,0,0.35)] backdrop-blur-xl
        shadow-[0_20px_80px_rgba(0,0,0,0.35)]
      "
    >
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">
            Estrutura do catálogo
          </p>
          <h3 className="mt-2 text-xl sm:text-2xl font-light">
            Lista de <span className="bs-title">categorias</span>
          </h3>
        </div>

        <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/55">
          {categories.length} item{categories.length > 1 ? "s" : ""}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-white/85">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              <th className="px-5 py-4 text-left text-[11px] font-medium uppercase tracking-[0.28em] text-white/45 sm:px-6">
                Nome
              </th>
              <th className="px-5 py-4 text-left text-[11px] font-medium uppercase tracking-[0.28em] text-white/45 sm:px-6">
                Slug
              </th>
              <th className="px-5 py-4 text-left text-[11px] font-medium uppercase tracking-[0.28em] text-white/45 sm:px-6">
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {categories.map((category) => (
              <tr
                key={category.id}
                className="border-b border-white/8 transition hover:bg-white/[0.03]"
              >
                <td className="px-5 py-5 sm:px-6">
                  <div className="flex flex-col">
                    <span className="font-medium text-white">
                      {category.name}
                    </span>
                    <span className="mt-1 text-xs text-white/40">
                      Categoria visível na organização da loja
                    </span>
                  </div>
                </td>

                <td className="px-5 py-5 sm:px-6">
                  <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs tracking-[0.18em] uppercase text-white/70">
                    {category.slug}
                  </span>
                </td>

                <td className="px-5 py-5 sm:px-6">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => onEdit(category)}
                      className="
                        inline-flex items-center justify-center rounded-full
                        border border-[var(--gold)]/25 bg-[rgba(212,175,55,0.08)]
                        px-4 py-2 text-[11px] uppercase tracking-[0.24em]
                        text-[var(--gold)] transition
                        hover:border-[var(--gold)]/50 hover:bg-[rgba(212,175,55,0.14)]
                      "
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => onDelete(category.id)}
                      className="
                        inline-flex items-center justify-center rounded-full
                        border border-red-400/20 bg-red-400/[0.06]
                        px-4 py-2 text-[11px] uppercase tracking-[0.24em]
                        text-red-300 transition
                        hover:border-red-400/35 hover:bg-red-400/[0.10]
                      "
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}