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
  return (
    <table className="w-full border border-white/10">

      <thead>
        <tr className="border-b border-white/10">

          <th className="p-4 text-left">Código</th>
          <th className="p-4 text-left">Desconto</th>
          <th className="p-4 text-left">Usado</th>
          <th className="p-4 text-left">Validade</th>
          <th className="p-4 text-left">Ações</th>

        </tr>
      </thead>

      <tbody>

        {coupons.map((coupon) => (

          <tr key={coupon.id} className="border-b border-white/10">

            <td className="p-4">{coupon.code}</td>

            <td className="p-4">{coupon.discount}%</td>

            <td className="p-4">
              {coupon.used}/{coupon.maxUses}
            </td>

            <td className="p-4">
              {new Date(coupon.expiresAt).toLocaleDateString()}
            </td>

            <td className="p-4 flex gap-4">

              <button
                onClick={() => onEdit(coupon)}
                className="text-blue-400"
              >
                Editar
              </button>

              <button
                onClick={() => onDelete(coupon.id)}
                className="text-red-400"
              >
                Excluir
              </button>

            </td>

          </tr>

        ))}

      </tbody>

    </table>
  );
}