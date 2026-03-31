"use client";

import { ShippingRate } from "../types/types";

type Props = {
  data: ShippingRate[];
  onEdit: (item: ShippingRate) => void;
  onDelete: (id: string) => void;
};

export default function ShippingTable({ data, onEdit, onDelete }: Props) {
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-white/5 text-left">
          <tr>
            <th className="p-3">Nome</th>
            <th className="p-3">Método</th>
            <th className="p-3">Preço</th>
            <th className="p-3">Prazo</th>
            <th className="p-3">CEP</th>
            <th className="p-3"></th>
          </tr>
        </thead>

        <tbody>
          {data.map((s) => (
            <tr key={s.id} className="border-t border-white/10">
              <td className="p-3">{s.name}</td>
              <td className="p-3">{s.method}</td>
              <td className="p-3">R$ {s.price.toFixed(2)}</td>
              <td className="p-3">
                {s.minDays}-{s.maxDays} dias
              </td>
              <td className="p-3">{s.cepPrefix || "Todos"}</td>

              <td className="p-3 flex gap-2">
                <button
                  onClick={() => onEdit(s)}
                  className="text-xs border px-3 py-1 rounded hover:border-[var(--gold)]"
                >
                  Editar
                </button>

                <button
                  onClick={() => onDelete(s.id)}
                  className="text-xs border px-3 py-1 rounded hover:border-red-400 text-red-400"
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
