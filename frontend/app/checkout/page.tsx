"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { apiFetch } from "@/lib/api";

function getCustomerId() {
  const id = localStorage.getItem("bs_customer");

  if (!id) {
    throw new Error("Usuário não autenticado");
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

type PaymentResponse = {
  id: string;
  orderId: string;
  method: string;
  status: string;
  amount: number;
  provider?: string | null;
  providerId?: string | null;
  providerRef?: string | null;
  qrCode?: string | null;
  qrCodeText?: string | null;
  cardLast4?: string | null;
  cardBrand?: string | null;
};

export default function CheckoutPage() {
  const {
    items,
    clear,
    subtotal,
    shipping,
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
    if (!couponCode.trim()) return;

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
    if (!items.length) {
      alert("Seu carrinho está vazio");
      return;
    }

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

      const order = await apiFetch<OrderResponse>("/orders/checkout", {
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
      });

      const paymentData = await apiFetch<PaymentResponse>("/payment", {
        method: "POST",
        body: JSON.stringify({
          orderId: order.id,
          method: payment,
        }),
      });

      clear();

      window.location.href = `/payment/${paymentData.orderId}`;
    } catch (err) {
      console.error(err);
      alert("Erro ao finalizar checkout");
    } finally {
      setLoading(false);
    }
  }

  const subtotalValue = subtotal();
  const shippingValue = shipping();
  const totalValue = subtotalValue - discount + shippingValue;

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 pt-32 pb-32">
      <p className="text-white/50 uppercase text-xs tracking-[0.4em] mb-4">
        Checkout seguro
      </p>

      <h1 className="text-3xl md:text-5xl tracking-widest uppercase mb-12 bs-title">
        Finalizar compra
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-14">

          {/* ENDEREÇO */}
          <div>
            <h2 className="uppercase tracking-widest text-xs mb-6">
              Endereço de entrega
            </h2>

            <div className="space-y-4">
              {addresses.map((address) => (
                <button
                  key={address.id}
                  onClick={() => setSelectedAddress(address.id)}
                  className={`
                    w-full text-left p-5 rounded-xl border transition
                    ${
                      selectedAddress === address.id
                        ? "border-[var(--gold)] bg-white/[0.03]"
                        : "border-white/10 hover:border-white/30"
                    }
                  `}
                >
                  <p className="text-sm">
                    {address.street}, {address.number}
                  </p>

                  {address.complement && (
                    <p className="text-xs text-white/60 mt-1">
                      {address.complement}
                    </p>
                  )}

                  <p className="text-xs text-white/60">
                    {address.district} - {address.city} - {address.state}
                  </p>

                  <p className="text-xs text-white/60">
                    CEP {address.zipCode}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* PAGAMENTO */}
          <div>
            <h2 className="uppercase tracking-widest text-xs mb-6">
              Forma de pagamento
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setPayment("pix")}
                className={`p-6 rounded-xl border transition text-left ${
                  payment === "pix"
                    ? "border-[var(--gold)] bg-white/[0.03]"
                    : "border-white/10"
                }`}
              >
                <p className="uppercase tracking-widest text-xs mb-2">PIX</p>
                <p className="text-white/60 text-sm">
                  Pagamento instantâneo com QR Code e código copia e cola.
                </p>
              </button>

              <button
                onClick={() => setPayment("card")}
                className={`p-6 rounded-xl border transition text-left ${
                  payment === "card"
                    ? "border-[var(--gold)] bg-white/[0.03]"
                    : "border-white/10"
                }`}
              >
                <p className="uppercase tracking-widest text-xs mb-2">Cartão</p>
                <p className="text-white/60 text-sm">
                  Integração via PagBank.
                </p>
              </button>
            </div>
          </div>

          {/* CUPOM */}
          <div>
            <h2 className="uppercase tracking-widest text-xs mb-6">
              Cupom de desconto
            </h2>

            <div className="flex gap-3">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Digite seu cupom"
                className="flex-1 border border-white/10 p-3 bg-black rounded-md"
                disabled={!!appliedCoupon}
              />

              <button
                onClick={applyCoupon}
                disabled={couponLoading || !!appliedCoupon}
                className="px-6 bg-[var(--gold)] text-black rounded-md"
              >
                {couponLoading
                  ? "..."
                  : appliedCoupon
                  ? "Aplicado"
                  : "Aplicar"}
              </button>
            </div>
          </div>
        </div>

        {/* RESUMO */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 p-6 md:p-8 border border-white/10 rounded-2xl bg-black/40 backdrop-blur">

            <h2 className="uppercase tracking-widest text-xs mb-6">
              Resumo do pedido
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-white/70">
                <span>Subtotal</span>
                <span>R$ {subtotalValue.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-white/70">
                <span>Frete</span>
                <span>R$ {shippingValue.toFixed(2)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Desconto ({appliedCoupon})</span>
                  <span>- R$ {discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-lg border-t border-white/10 pt-4">
                <span>Total</span>
                <span className="text-[var(--gold)] font-semibold">
                  R$ {totalValue.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full mt-8 py-4 rounded-full bg-[var(--gold)] text-black text-xs tracking-[0.35em] uppercase"
            >
              {loading ? "Processando..." : "Finalizar compra"}
            </button>

          </div>
        </div>
      </div>
    </section>
  );
}