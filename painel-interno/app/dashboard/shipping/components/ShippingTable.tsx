"use client";

import { ShippingRate } from "../types/types";

type Props = {
  data: ShippingRate[];
  onEdit: (item: ShippingRate) => void;
  onDelete: (id: string) => void;
};

export default function ShippingTable({ data, onEdit, onDelete }: Props) {
  return (
    <div
      className="
      border border-white/10
      rounded-2xl
      overflow-hidden
      bg-white/[0.02]
    "
    >
      <table className="w-full text-sm">
        {/* HEADER */}
        <thead className="bg-white/[0.04] text-white/60 text-[11px] uppercase tracking-[0.25em]">
          <tr>
            <th className="px-6 py-4 text-left">Nome</th>
            <th className="px-6 py-4 text-left">Método</th>
            <th className="px-6 py-4 text-left">Preço</th>
            <th className="px-6 py-4 text-left">Prazo</th>
            <th className="px-6 py-4 text-left">CEP</th>
            <th className="px-6 py-4 text-right">Ações</th>
          </tr>
        </thead>

        {/* BODY */}
        <tbody>
          {data.map((s) => (
            <tr
              key={s.id}
              className="
                border-t border-white/5
                hover:bg-white/[0.03]
                transition
              "
            >
              {/* NOME */}
              <td className="px-6 py-5">
                <p className="text-white text-sm font-medium">{s.name}</p>
              </td>

              {/* MÉTODO */}
              <td className="px-6 py-5">
                <span className="text-white/60 text-xs uppercase tracking-widest">
                  {s.method}
                </span>
              </td>

              {/* PREÇO */}
              <td className="px-6 py-5">
                <span className="text-[var(--gold)] font-medium">
                  R$ {s.price.toFixed(2)}
                </span>
              </td>

              {/* PRAZO */}
              <td className="px-6 py-5 text-white/70 text-xs">
                {s.minDays}-{s.maxDays} dias
              </td>

              {/* CEP */}
              <td className="px-6 py-5 text-white/50 text-xs">
                {s.cepPrefix || "Todos os CEPs"}
              </td>

              {/* AÇÕES */}
              <td className="px-6 py-5">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(s)}
                    className="
                      px-4 py-2
                      text-[10px]
                      uppercase tracking-[0.25em]
                      border border-white/15
                      rounded-full
                      hover:border-[var(--gold)]
                      hover:text-[var(--gold)]
                      transition
                    "
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => onDelete(s.id)}
                    className="
                      px-4 py-2
                      text-[10px]
                      uppercase tracking-[0.25em]
                      border border-white/15
                      rounded-full
                      text-red-400
                      hover:border-red-400
                      hover:bg-red-400/10
                      transition
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
  );
}
