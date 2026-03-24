"use client";

import { Coupon } from "../types/types";

type Props = {
  coupons: Coupon[];
  onEdit: (coupon: Coupon) => void;
  onDelete: (id: string) => void;
};

export default function CouponTable({
  coupons,
  onEdit,
  onDelete,
}: Props) {

  function isExpired(date: string) {
    return new Date(date) < new Date();
  }

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden">

      <table className="w-full text-sm">

        <thead className="bg-white/[0.03]">
          <tr>
            <th className="p-4 text-left">Código</th>
            <th className="p-4 text-left">Desconto</th>
            <th className="p-4 text-left">Uso</th>
            <th className="p-4 text-left">Status</th>
            <th className="p-4 text-left">Ações</th>
          </tr>
        </thead>

        <tbody>

          {coupons.map((coupon) => {

            const expired = isExpired(coupon.expiresAt);

            return (
              <tr key={coupon.id} className="border-t border-white/10">

                <td className="p-4 font-medium">
                  {coupon.code}
                  {coupon.isFeatured && (
                    <span className="ml-2 text-xs text-[var(--gold)]">
                      ★
                    </span>
                  )}
                </td>

                <td className="p-4">{coupon.discount}%</td>

                <td className="p-4">
                  {coupon.used}/{coupon.maxUses}
                </td>

                <td className="p-4">
                  {expired ? (
                    <span className="text-red-400 text-xs">Expirado</span>
                  ) : !coupon.active ? (
                    <span className="text-white/40 text-xs">Inativo</span>
                  ) : (
                    <span className="text-green-400 text-xs">Ativo</span>
                  )}
                </td>

                <td className="p-4 flex gap-4">

                  <button
                    onClick={() => onEdit(coupon)}
                    className="text-blue-400 hover:underline"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => onDelete(coupon.id)}
                    className="text-red-400 hover:underline"
                  >
                    Excluir
                  </button>

                </td>

              </tr>
            );
          })}

        </tbody>

      </table>
    </div>
  );
}