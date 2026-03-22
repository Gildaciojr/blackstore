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
    <div className="flex flex-wrap items-center justify-center gap-2 mt-6 text-xs sm:text-sm">

      <button
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
        className="px-3 sm:px-4 py-2 border border-white/20 rounded-md disabled:opacity-40"
      >
        Anterior
      </button>

      <span className="px-3 sm:px-4 py-2">
        {page} / {totalPages}
      </span>

      <button
        disabled={page === totalPages}
        onClick={() => setPage(page + 1)}
        className="px-3 sm:px-4 py-2 border border-white/20 rounded-md disabled:opacity-40"
      >
        Próxima
      </button>

    </div>
  );
}