"use client";

type Product = {
  id:string;
  name:string;
  price:number;
  stock:number;
};

type Props = {
  products:Product[];
  onEdit:(p:Product)=>void;
  onDelete:(id:string)=>void;
};

export default function ProductTable({
  products,
  onEdit,
  onDelete,
}:Props){

  return(

    <div className="bs-glass rounded-3xl border border-white/10 overflow-hidden">

      <table className="w-full">

        <thead>

          <tr className="border-b border-white/10 text-xs uppercase tracking-[0.3em] text-white/50">

            <th className="p-5 text-left">Produto</th>
            <th className="p-5 text-left">Preço</th>
            <th className="p-5 text-left">Estoque</th>
            <th className="p-5 text-left">Ações</th>

          </tr>

        </thead>

        <tbody>

          {products.map((p)=>(
            <tr
              key={p.id}
              className="border-b border-white/5 hover:bg-white/5 transition"
            >

              <td className="p-5">{p.name}</td>

              <td className="p-5">
                R$ {p.price.toFixed(2)}
              </td>

              <td className="p-5">
                {p.stock}
              </td>

              <td className="p-5 flex gap-3">

                <button
                  onClick={()=>onEdit(p)}
                  className="
                  text-[var(--gold)]
                  text-xs
                  tracking-[0.2em]
                  uppercase
                  "
                >
                  Editar
                </button>

                <button
                  onClick={()=>onDelete(p.id)}
                  className="
                  text-red-400
                  text-xs
                  tracking-[0.2em]
                  uppercase
                  "
                >
                  Excluir
                </button>

              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>

  );
}