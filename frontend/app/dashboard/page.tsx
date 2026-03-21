export default function DashboardHome() {
  return (
    <div>
      <h1 className="text-3xl md:text-4xl tracking-widest uppercase bs-title bs-title-hover">
        Visão geral
      </h1>

      <p className="mt-6 text-white/60">
        Aqui você vai ver indicadores: pedidos, faturamento, estoque baixo e status de pagamentos.
      </p>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="border border-white/10 bg-black/40 p-8">
          <p className="text-xs tracking-widest uppercase text-white/50">
            Pedidos hoje
          </p>
          <p className="mt-4 text-3xl text-[var(--gold)]">0</p>
        </div>

        <div className="border border-white/10 bg-black/40 p-8">
          <p className="text-xs tracking-widest uppercase text-white/50">
            Faturamento
          </p>
          <p className="mt-4 text-3xl text-[var(--gold)]">R$ 0,00</p>
        </div>

        <div className="border border-white/10 bg-black/40 p-8">
          <p className="text-xs tracking-widest uppercase text-white/50">
            Estoque baixo
          </p>
          <p className="mt-4 text-3xl text-[var(--gold)]">0</p>
        </div>
      </div>
    </div>
  );
}