"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { useEffect, useState } from "react";

export default function CartPage() {
  const {
    items,
    increase,
    decrease,
    removeItem,
    loadCart,
    calculateShipping,
    selectShipping,
    shippingOptions,
    selectedShipping,
    subtotal,
    shipping,
    total,
  } = useCart();

  const [zip, setZip] = useState("");

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  if (items.length === 0) {
    return (
      <section className="pt-32 pb-24 text-center px-6">
        <h1 className="text-3xl md:text-5xl tracking-widest uppercase bs-title">
          Carrinho vazio
        </h1>

        <p className="mt-6 text-white/60">
          Adicione produtos para continuar sua experiência premium.
        </p>

        <Link
          href="/catalog"
          className="mt-10 inline-block px-10 py-4 rounded-full bg-[var(--gold)] text-black text-xs tracking-[0.35em] uppercase hover:scale-105 transition"
        >
          Explorar catálogo
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-28 pb-40">

      <h1 className="text-3xl md:text-5xl tracking-widest uppercase mb-12 bs-title">
        Seu carrinho
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ITENS */}
        <div className="lg:col-span-2 space-y-10">

          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 md:gap-8 pb-6 border-b border-white/10"
            >
              <div className="relative w-28 md:w-40 aspect-3/4 overflow-hidden rounded-xl">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              </div>

              <div className="flex-1 flex flex-col justify-between">

                <div>
                  <h3 className="uppercase tracking-widest text-xs md:text-sm">
                    {item.name}
                  </h3>

                  <p className="mt-2 text-[var(--gold)] text-lg md:text-xl">
                    R$ {item.price.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4">

                  <div className="flex items-center gap-3 text-sm">
                    <button
                      onClick={() => decrease(item.id)}
                      className="w-8 h-8 border border-white/20 rounded-full"
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() => increase(item.id)}
                      className="w-8 h-8 border border-white/20 rounded-full"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-400 text-[10px] uppercase tracking-widest"
                  >
                    Remover
                  </button>

                </div>

              </div>
            </div>
          ))}
        </div>

        {/* RESUMO */}
        <div className="border border-white/10 p-6 md:p-10 bg-black/40 backdrop-blur rounded-2xl h-fit sticky top-24">

          <h2 className="uppercase tracking-widest text-xs mb-6">
            Resumo
          </h2>

          {/* CEP */}
          <div className="mb-6">
            <div className="flex gap-2">
              <input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="CEP"
                className="flex-1 bg-black border border-white/20 px-3 py-2 text-sm rounded-md"
              />
              <button
                onClick={() => calculateShipping(zip)}
                className="px-4 bg-white text-black text-xs rounded-md"
              >
                OK
              </button>
            </div>
          </div>

          {/* FRETE */}
          {shippingOptions.length > 0 && (
            <div className="mb-6 space-y-2">
              {shippingOptions.map((option) => (
                <button
                  key={option.method}
                  onClick={() => selectShipping(option.method)}
                  className={`w-full p-3 text-left text-xs border rounded-lg ${
                    selectedShipping?.method === option.method
                      ? "border-[var(--gold)]"
                      : "border-white/10"
                  }`}
                >
                  {option.name} - R$ {option.price.toFixed(2)}
                </button>
              ))}
            </div>
          )}

          {/* VALORES */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>R$ {subtotal().toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Frete</span>
              <span>R$ {shipping().toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-lg border-t border-white/10 pt-4">
              <span>Total</span>
              <span className="text-[var(--gold)]">
                R$ {total().toFixed(2)}
              </span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="block mt-8 py-4 text-center rounded-full bg-[var(--gold)] text-black text-xs tracking-[0.35em] uppercase hover:scale-105 transition"
          >
            Finalizar compra
          </Link>

        </div>
      </div>
    </section>
  );
}