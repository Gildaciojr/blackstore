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
    discount,
    appliedCouponCode,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [zip, setZip] = useState("");

  // 🔥 NOVO (cupom)
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // 🔥 sincroniza cupom com store
  useEffect(() => {
    if (appliedCouponCode) {
      setCouponInput(appliedCouponCode);
    }
  }, [appliedCouponCode]);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;

    try {
      setCouponLoading(true);
      await applyCoupon(couponInput);
    } catch (err) {
      setCouponInput("");
      alert(err instanceof Error ? err.message : "Erro ao aplicar cupom");
    } finally {
      setCouponLoading(false);
    }
  }

  // 🔥 FRETE GRÁTIS
  const FREE_SHIPPING_THRESHOLD = 299;
  const subtotalValue = subtotal();
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - subtotalValue;

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
      {/* HEADER */}
      <p className="text-white/50 uppercase text-xs tracking-[0.4em] mb-4">
        Checkout seguro
      </p>

      <h1 className="text-3xl md:text-5xl tracking-widest uppercase mb-10 bs-title">
        Seu carrinho
      </h1>

      {/* 🔥 FRETE BAR */}
      <div className="mb-10">
        <div className="flex justify-between text-xs text-white/60 mb-2 uppercase tracking-widest">
          <span>Frete grátis</span>
          <span>
            {remainingForFreeShipping > 0
              ? `Faltam R$ ${remainingForFreeShipping.toFixed(2)}`
              : "Você desbloqueou"}
          </span>
        </div>

        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--gold)] transition-all duration-500"
            style={{
              width: `${Math.min(
                (subtotalValue / FREE_SHIPPING_THRESHOLD) * 100,
                100,
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* ITENS */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <div
              key={item.cartItemId}
              className="
                flex gap-4 md:gap-8 
                p-4 md:p-6 
                rounded-2xl 
                bg-white/[0.02] 
                border border-white/10 
                hover:border-[var(--gold)]/30 
                transition-all duration-300
              "
            >
              <div className="relative w-28 md:w-40 aspect-[3/4] overflow-hidden rounded-xl">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="uppercase tracking-widest text-xs md:text-sm text-white/90">
                    {item.name}
                  </h3>

                  {item.size && (
                    <p className="mt-2 text-[10px] uppercase tracking-widest text-white/40">
                      Tamanho: {item.size}
                    </p>
                  )}

                  <p className="mt-2 text-[var(--gold)] text-lg md:text-xl font-medium">
                    R$ {item.price.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-3 text-sm">
                    <button
                      onClick={() => decrease(item.cartItemId)}
                      className="w-9 h-9 border border-white/20 rounded-full hover:border-[var(--gold)] transition"
                    >
                      −
                    </button>

                    <span className="min-w-[20px] text-center">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => increase(item.cartItemId)}
                      className="w-9 h-9 border border-white/20 rounded-full hover:border-[var(--gold)] transition"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.cartItemId)}
                    className="text-red-400 text-[10px] uppercase tracking-widest hover:text-red-300 transition"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* 🔥 UPSELL */}
          <div className="mt-6 p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
            <p className="text-xs uppercase tracking-widest text-white/50 mb-3">
              Dica Blackstore
            </p>

            <p className="text-sm text-white/70">
              Combine peças e monte um look completo para potencializar seu
              estilo.
            </p>
          </div>
        </div>

        {/* RESUMO */}
        <div
          className="
          border border-white/10 
          p-6 md:p-10 
          bg-black/40 
          backdrop-blur 
          rounded-2xl 
          h-fit 
          sticky top-24
        "
        >
          <h2 className="uppercase tracking-widest text-xs mb-6">
            Resumo do pedido
          </h2>

          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-widest text-white/50 mb-2">
              Cupom de desconto
            </p>

            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Digite seu cupom"
                className={`
                  flex-1 px-4 py-3 text-sm rounded-md bg-black border transition
                  ${
                    appliedCouponCode
                      ? "border-green-500 text-green-400"
                      : "border-white/20 focus:border-[var(--gold)]"
                  }
                `}
                disabled={!!appliedCouponCode}
              />

              {!appliedCouponCode ? (
                <button
                  onClick={handleApplyCoupon}
                  className="
                    px-5 py-3 text-xs uppercase tracking-widest
                    bg-[var(--gold)] text-black rounded-md
                    hover:scale-105 active:scale-95 transition
                  "
                >
                  {couponLoading ? "Validando..." : "Aplicar"}
                </button>
              ) : (
                <button
                  onClick={removeCoupon}
                  className="
                    px-5 py-3 text-xs uppercase tracking-widest
                    border border-white/20 rounded-md
                    hover:border-red-400 hover:text-red-400 transition
                  "
                >
                  Remover
                </button>
              )}
            </div>

            {appliedCouponCode && (
              <div className="mt-3 p-3 rounded-md border border-green-500/30 bg-green-500/10">
                <p className="text-green-400 text-sm">
                  Cupom <strong>{appliedCouponCode}</strong> aplicado
                </p>

                <p className="text-xs text-green-300 mt-1">
                  Você economizou R$ {discount().toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* CEP */}
          <div className="mb-6">
            <div className="flex gap-2">
              <input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="Digite seu CEP"
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
                  className={`w-full p-3 text-left text-xs border rounded-lg transition ${
                    selectedShipping?.method === option.method
                      ? "border-[var(--gold)] bg-white/5"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  {option.name} — R$ {option.price.toFixed(2)}
                </button>
              ))}
            </div>
          )}

          {/* VALORES */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-white/70">
              <span>Subtotal</span>
              <span>R$ {subtotal().toFixed(2)}</span>
            </div>

            {/* 🔥 DESCONTO */}
            {discount() > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Desconto</span>
                <span>- R$ {discount().toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-white/70">
              <span>Frete</span>
              <span>R$ {shipping().toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-lg border-t border-white/10 pt-4">
              <span>Total</span>
              <span className="text-[var(--gold)] font-semibold">
                R$ {total().toFixed(2)}
              </span>
            </div>
          </div>

          {/* PROVA */}
          <div className="mt-6 text-[10px] md:text-xs text-white/60 uppercase tracking-widest space-y-1">
            <p>✦ Compra segura</p>
            <p>✦ Envio rápido</p>
            <p>✦ Troca facilitada</p>
          </div>

          {/* CTA */}
          <Link
            href="/checkout"
            className="
              block mt-8 py-4 text-center rounded-full 
              bg-[var(--gold)] text-black 
              text-xs tracking-[0.35em] uppercase 
              hover:scale-105 active:scale-[0.98]
              transition
            "
          >
            Finalizar compra segura
          </Link>
        </div>
      </div>

      {/* 🔥 MOBILE FIXO */}
      <div className="fixed bottom-0 left-0 w-full bg-black/95 border-t border-white/10 p-4 flex items-center justify-between lg:hidden z-50">
        <div>
          <p className="text-[10px] uppercase text-white/50 tracking-widest">
            Total
          </p>
          <p className="text-[var(--gold)] font-semibold">
            R$ {total().toFixed(2)}
          </p>
        </div>

        <Link
          href="/checkout"
          className="
            px-6 py-3 
            bg-[var(--gold)] 
            text-black 
            text-[10px] 
            uppercase 
            tracking-[0.35em] 
            rounded-full
          "
        >
          Finalizar
        </Link>
      </div>
    </section>
  );
}
