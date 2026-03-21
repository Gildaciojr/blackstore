"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { apiFetch } from "@/lib/api";

function getCustomerId() {
  let id = localStorage.getItem("bs_customer");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("bs_customer", id);
  }

  return id;
}

type Address = {
  id: string;
  name: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
};

type OrderResponse = {
  id: string;
  total: number;
};

type CouponResponse = {
  code: string;
  discount: number;
};

export default function CheckoutPage() {

  const {
    items,
    clear,
    subtotal,
    shipping,
    total,
    selectedShipping,
  } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const [payment, setPayment] = useState<"pix" | "card">("pix");
  const [loading, setLoading] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {

    const customerId = getCustomerId();

    apiFetch<Address[]>(`/address/${customerId}`)
      .then(setAddresses)
      .catch(() => {});

  }, []);

  async function applyCoupon() {

    if (!couponCode) return;

    try {

      setCouponLoading(true);

      const coupon = await apiFetch<CouponResponse>(
        `/coupons/${couponCode.toUpperCase()}`
      );

      const discountValue = subtotal() * (coupon.discount / 100);

      setDiscount(discountValue);
      setAppliedCoupon(coupon.code);

    } catch {

      alert("Cupom inválido ou expirado");

    } finally {

      setCouponLoading(false);

    }

  }

  async function handleCheckout() {

    if (!items.length) return;

    if (!selectedAddress) {
      alert("Selecione um endereço");
      return;
    }

    if (!selectedShipping) {
      alert("Selecione o frete no carrinho");
      return;
    }

    try {

      setLoading(true);

      const customerId = getCustomerId();

      const order = await apiFetch<OrderResponse>(
        "/orders/checkout",
        {
          method: "POST",
          body: JSON.stringify({
            customerId,
            addressId: selectedAddress,
            shippingPrice: selectedShipping.price,
            shippingMethod: selectedShipping.method,
            shippingName: selectedShipping.name,
            shippingDeadline: selectedShipping.deadline,
            couponCode: appliedCoupon ?? undefined,
          }),
        }
      );

      clear();

      window.location.href = `/order-success/${order.id}`;

    } catch (err) {

      console.error(err);
      alert("Erro ao criar pedido");

    } finally {

      setLoading(false);

    }

  }

  const subtotalValue = subtotal();
  const shippingValue = shipping();
  const totalValue = subtotalValue - discount + shippingValue;

  return (
    <section className="max-w-4xl mx-auto px-8 pt-40 pb-32">

      <h1 className="text-4xl md:text-5xl tracking-widest uppercase mb-20 bs-title">
        Checkout
      </h1>

      {/* ENDEREÇOS */}
      <div className="mb-16">

        <h2 className="uppercase tracking-widest text-sm mb-8">
          Endereço de entrega
        </h2>

        <div className="space-y-4">

          {addresses.map((address) => (

            <button
              key={address.id}
              onClick={() => setSelectedAddress(address.id)}
              className={`
                w-full text-left border p-6 transition
                ${
                  selectedAddress === address.id
                    ? "border-[var(--gold)]"
                    : "border-white/10 hover:border-white/40"
                }
              `}
            >

              <p className="text-sm">
                {address.street}, {address.number}
              </p>

              <p className="text-xs text-white/60">
                {address.city} - {address.state}
              </p>

              <p className="text-xs text-white/60">
                CEP {address.zipCode}
              </p>

            </button>

          ))}

        </div>

      </div>

      {/* PAGAMENTO */}
      <div className="mb-16">

        <h2 className="uppercase tracking-widest text-sm mb-8">
          Forma de pagamento
        </h2>

        <div className="grid grid-cols-2 gap-6">

          <button
            onClick={() => setPayment("pix")}
            className={`border p-8 ${
              payment === "pix"
                ? "border-[var(--gold)]"
                : "border-white/10"
            }`}
          >
            PIX
          </button>

          <button
            onClick={() => setPayment("card")}
            className={`border p-8 ${
              payment === "card"
                ? "border-[var(--gold)]"
                : "border-white/10"
            }`}
          >
            Cartão
          </button>

        </div>

      </div>

      {/* CUPOM */}
      <div className="mb-16">

        <h2 className="uppercase tracking-widest text-sm mb-6">
          Cupom de desconto
        </h2>

        <div className="flex gap-4">

          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Digite seu cupom"
            className="flex-1 border border-white/10 p-3 bg-black"
            disabled={!!appliedCoupon}
          />

          <button
            onClick={applyCoupon}
            disabled={couponLoading || !!appliedCoupon}
            className="px-6 bg-[var(--gold)] text-black"
          >
            {couponLoading
              ? "..."
              : appliedCoupon
              ? "Aplicado"
              : "Aplicar"}
          </button>

        </div>

      </div>

      {/* RESUMO */}
      <div className="border-t border-white/10 pt-10">

        <div className="space-y-4 text-sm mb-10">

          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>R$ {subtotalValue.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>Frete</span>
            <span>R$ {shippingValue.toFixed(2)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-green-400">
              <span>Desconto ({appliedCoupon})</span>
              <span>- R$ {discount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-lg">

            <span>Total</span>

            <span className="text-[var(--gold)]">
              R$ {totalValue.toFixed(2)}
            </span>

          </div>

        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="
            w-full py-4 rounded-full
            bg-[var(--gold)] text-black
            text-xs tracking-[0.35em] uppercase
            hover:scale-105 transition
          "
        >

          {loading ? "Processando..." : "Finalizar compra"}

        </button>

      </div>

    </section>
  );
}