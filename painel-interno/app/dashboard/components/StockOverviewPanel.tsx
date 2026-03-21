"use client";

type StockProduct = {
  id: string;
  name: string;
  slug: string;
  stock: number;
  image: string;
};

type Props = {
  products: StockProduct[];
};

function getStockStatus(stock: number): {
  label: string;
  classes: string;
} {
  if (stock <= 3) {
    return {
      label: "Crítico",
      classes: "border-red-400/20 bg-red-400/10 text-red-300",
    };
  }

  if (stock <= 8) {
    return {
      label: "Baixo",
      classes: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    };
  }

  return {
    label: "Ok",
    classes: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  };
}

export default function StockOverviewPanel({ products }: Props) {
  const lowStockProducts = [...products]
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  return (
    <div className="bs-glass border border-white/10 rounded-[28px] p-6 md:p-7 shadow-[0_20px_80px_rgba(0,0,0,0.30)]">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Estoque
          </p>

          <h3 className="text-2xl font-light mt-2">
            Atenção ao <span className="bs-title">estoque</span>
          </h3>
        </div>

        <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/55">
          Monitoramento rápido
        </div>
      </div>

      <div className="space-y-4">
        {lowStockProducts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-center text-white/45">
            Nenhum produto disponível para monitoramento.
          </div>
        ) : (
          lowStockProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock);

            return (
              <div
                key={product.id}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition hover:bg-white/[0.05]"
              >
                <div className="h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-black/20 shrink-0">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${product.image}`}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{product.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">
                    {product.slug}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-sm text-white">{product.stock} un.</span>

                  <span
                    className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] ${stockStatus.classes}`}
                  >
                    {stockStatus.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}