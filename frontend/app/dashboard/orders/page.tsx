export default function AdminOrders() {
  return (
    <div>
      <h1 className="text-3xl md:text-4xl tracking-widest uppercase bs-title bs-title-hover">
        Pedidos
      </h1>

      <p className="mt-6 text-white/60">
        Lista de pedidos, status do pagamento (PagBank) e status de envio.
      </p>

      <div className="mt-12 border border-white/10 bg-black/40 p-10">
        <p className="text-white/70">
          (Próximo passo) Tabela de pedidos + detalhes por pedido.
        </p>
      </div>
    </div>
  );
}