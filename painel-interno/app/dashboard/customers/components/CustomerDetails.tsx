"use client";

import { Customer } from "../types/types";

type Props = {
  customer: Customer | null;
  onClose: () => void;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function CustomerDetails({
  customer,
  onClose,
}: Props) {
  if (!customer) return null;

  const totalSpent =
    customer.totalSpent ??
    customer.orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6">

      <div className="bg-[#0b0b0d] border border-white/10 p-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl">

        <div className="flex justify-between items-center mb-8">

          <h2 className="text-2xl">
            {customer.name} {customer.surname}
          </h2>

          <button
            onClick={onClose}
            className="border border-white/20 px-4 py-2"
          >
            Fechar
          </button>

        </div>

        {/* INFO */}

        <div className="grid md:grid-cols-2 gap-10 mb-10">

          <div className="border border-white/10 p-6">

            <h3 className="mb-4 text-lg">Informações</h3>

            <p>Email: {customer.email}</p>

            <p className="mt-2">
              Telefone: {customer.phone || "—"}
            </p>

            <p className="mt-2">
              Cadastro:
              {" "}
              {new Date(customer.createdAt).toLocaleDateString("pt-BR")}
            </p>

          </div>

          <div className="border border-white/10 p-6">

            <h3 className="mb-4 text-lg">Resumo</h3>

            <p>Pedidos: {customer.orders.length}</p>

            <p className="mt-2">
              Total gasto: <b>{formatCurrency(totalSpent)}</b>
            </p>

          </div>

        </div>

        {/* ENDEREÇOS */}

        <div className="border border-white/10 p-6 mb-10">

          <h3 className="text-lg mb-4">Endereços</h3>

          {customer.addresses.length === 0 && (
            <p className="text-white/50">Nenhum endereço cadastrado</p>
          )}

          {customer.addresses.map((addr, i) => (
            <div key={i} className="border-b border-white/10 py-3">

              <p>
                {addr.street}, {addr.number}
              </p>

              <p className="text-white/70">
                {addr.city} - {addr.state}
              </p>

              <p className="text-white/70">
                CEP {addr.zipCode}
              </p>

            </div>
          ))}

        </div>

        {/* PEDIDOS */}

        <div className="border border-white/10 p-6">

          <h3 className="text-lg mb-4">Pedidos</h3>

          {customer.orders.length === 0 && (
            <p className="text-white/50">Nenhum pedido</p>
          )}

          {customer.orders.map((order) => (
            <div
              key={order.id}
              className="flex justify-between border-b border-white/10 py-3 text-sm"
            >
              <span>#{order.id.slice(0, 8)}</span>

              <span>{formatCurrency(order.total)}</span>

              <span>{order.status}</span>

              <span>
                {new Date(order.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
          ))}

        </div>

      </div>

    </div>
  );
}