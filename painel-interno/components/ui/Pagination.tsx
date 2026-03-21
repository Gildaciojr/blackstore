"use client";

type Props = {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
};

export default function Pagination({
  page,
  totalPages,
  setPage,
}: Props) {
  return (
    <div className="flex gap-2 mt-6">

      <button
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
        className="px-4 py-2 border border-white/20"
      >
        Anterior
      </button>

      <span className="px-4 py-2">
        {page} / {totalPages}
      </span>

      <button
        disabled={page === totalPages}
        onClick={() => setPage(page + 1)}
        className="px-4 py-2 border border-white/20"
      >
        Próxima
      </button>

    </div>
  );
}