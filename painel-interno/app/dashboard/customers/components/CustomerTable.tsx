"use client";

import { Customer } from "../types/types";

type Props = {
  customers: Customer[];
  onSelect: (customer: Customer) => void;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function CustomerTable({ customers, onSelect }: Props) {
  return (
    <table className="w-full border border-white/10">
      <thead>
        <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/60">
          <th className="p-4 text-left">Cliente</th>
          <th className="p-4 text-left">Email</th>
          <th className="p-4 text-left">Telefone</th>
          <th className="p-4 text-left">Pedidos</th>
          <th className="p-4 text-left">Total gasto</th>
        </tr>
      </thead>

      <tbody>
        {customers.map((customer) => {
          const total =
            customer.totalSpent ??
            customer.orders.reduce((sum, order) => sum + order.total, 0);

          const orders =
            customer.ordersCount ?? customer.orders.length;

          return (
            <tr
              key={customer.id}
              onClick={() => onSelect(customer)}
              className="border-b border-white/10 cursor-pointer hover:bg-white/5 transition"
            >
              <td className="p-4">
                {customer.name} {customer.surname}
              </td>

              <td className="p-4 text-white/70">{customer.email}</td>

              <td className="p-4">
                {customer.phone || "—"}
              </td>

              <td className="p-4">{orders}</td>

              <td className="p-4 font-semibold">
                {formatCurrency(total)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}