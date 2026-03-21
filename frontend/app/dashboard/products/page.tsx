export default function AdminProducts() {
  return (
    <div>
      <h1 className="text-3xl md:text-4xl tracking-widest uppercase bs-title bs-title-hover">
        Produtos
      </h1>

      <p className="mt-6 text-white/60">
        Aqui você vai cadastrar produtos, alterar preço, desconto, fotos e estoque.
      </p>

      <div className="mt-12 border border-white/10 bg-black/40 p-10">
        <p className="text-white/70">
          (Próximo passo) Form de cadastro + tabela de produtos.
        </p>
      </div>
    </div>
  );
}