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
    discount,
    shipping,
    total,
    zipCode,
    shippingOptions,
    selectedShipping,
    calculateShipping,
    selectShipping,
    appliedCouponCode,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const [payment, setPayment] = useState<"pix" | "card">("pix");
  const [loading, setLoading] = useState(false);

  const [couponCode, setCouponCode] = useState(appliedCouponCode ?? "");
  const [couponLoading, setCouponLoading] = useState(false);

  const [zip, setZip] = useState(zipCode);
  const [shippingLoading, setShippingLoading] = useState(false);

  /**
   * 🔒 CONTROLE ANTI DUPLO CLICK (CRÍTICO)
   */
  const [checkoutLock, setCheckoutLock] = useState(false);

  useEffect(() => {
    try {
      const customerId = getCustomerId();

      apiFetch<Address[]>(`/address/${customerId}`)
        .then(setAddresses)
        .catch(() => {});
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    setCouponCode(appliedCouponCode ?? "");
  }, [appliedCouponCode]);

  useEffect(() => {
    setZip(zipCode);
  }, [zipCode]);

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;

    try {
      setCouponLoading(true);
      await applyCoupon(couponCode);
    } catch {
      alert("Cupom inválido ou expirado");
    } finally {
      setCouponLoading(false);
    }
  }

  async function handleCalculateShipping() {
    if (!zip.trim()) {
      alert("Digite seu CEP");
      return;
    }

    try {
      setShippingLoading(true);
      await calculateShipping(zip);
    } catch {
      alert("Erro ao calcular frete");
    } finally {
      setShippingLoading(false);
    }
  }

  async function handleCheckout() {
    /**
     * 🔒 BLOQUEIO DUPLO CLICK
     */
    if (loading || checkoutLock) return;

    if (!items.length) {
      alert("Seu carrinho está vazio");
      return;
    }

    if (!selectedAddress) {
      alert("Selecione um endereço");
      return;
    }

    if (!selectedShipping) {
      alert("Selecione o frete");
      return;
    }

    let customerId: string;

    try {
      customerId = getCustomerId();
    } catch {
      alert("Sessão inválida. Faça login novamente.");
      return;
    }

    try {
      setLoading(true);
      setCheckoutLock(true);

      /**
       * 🔥 CRIA PEDIDO
       */
      const order = await apiFetch<OrderResponse>("/orders/checkout", {
        method: "POST",
        body: JSON.stringify({
          customerId,
          addressId: selectedAddress,
          shippingPrice: selectedShipping.price,
          shippingMethod: selectedShipping.method,
          shippingName: selectedShipping.name,
          shippingDeadline: selectedShipping.deadline,
          couponCode: appliedCouponCode ?? undefined,
        }),
      });

      if (!order?.id) {
        throw new Error("Falha ao criar pedido");
      }

      /**
       * 🔥 CRIA PAGAMENTO
       */
      const paymentData = await apiFetch<PaymentResponse>("/payment", {
        method: "POST",
        body: JSON.stringify({
          orderId: order.id,
          method: payment,
        }),
      });

      if (!paymentData?.orderId) {
        throw new Error("Falha ao criar pagamento");
      }

      /**
       * 🔥 LIMPA CARRINHO SOMENTE SE TUDO DER CERTO
       */
      clear();

      /**
       * 🔥 REDIRECIONAMENTO SEGURO
       */
      window.location.href = `/payment/${paymentData.orderId}`;
    } catch (err) {
      console.error(err);
      alert("Erro ao finalizar checkout");
      setCheckoutLock(false);
    } finally {
      setLoading(false);
    }
  }

  const subtotalValue = subtotal();
  const discountValue = discount();
  const shippingValue = shipping();
  const totalValue = total();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-24 sm:pt-28 md:pt-32 pb-24 sm:pb-28 md:pb-32">
      <p className="text-white/50 uppercase text-[10px] sm:text-xs tracking-[0.35em] sm:tracking-[0.4em] mb-4">
        Checkout seguro
      </p>

      <h1 className="text-3xl sm:text-4xl md:text-5xl tracking-widest uppercase mb-10 sm:mb-12 bs-title">
        Finalizar compra
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
        <div className="lg:col-span-2 space-y-10 sm:space-y-12 md:space-y-14">

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
                    w-full text-left p-4 sm:p-5 rounded-xl border transition
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

          {/* FRETE */}
          <div>
            <h2 className="uppercase tracking-widest text-xs mb-6">
              Frete
            </h2>

            <div className="rounded-xl border border-white/10 p-4 sm:p-5 bg-black/30">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="Digite seu CEP"
                  className="flex-1 border border-white/10 p-3 bg-black rounded-md text-sm"
                />

                <button
                  onClick={handleCalculateShipping}
                  disabled={shippingLoading}
                  className="px-6 py-3 bg-[var(--gold)] text-black rounded-md text-sm sm:text-base"
                >
                  {shippingLoading ? "Calculando..." : "Calcular"}
                </button>
              </div>

              {shippingOptions.length > 0 && (
                <div className="mt-4 space-y-3">
                  {shippingOptions.map((option) => (
                    <button
                      key={option.method}
                      onClick={() => selectShipping(option.method)}
                      className={`
                        w-full text-left p-4 rounded-xl border transition
                        ${
                          selectedShipping?.method === option.method
                            ? "border-[var(--gold)] bg-white/[0.03]"
                            : "border-white/10 hover:border-white/30"
                        }
                      `}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-sm sm:text-base">{option.name}</p>
                          <p className="text-xs text-white/60">
                            Prazo: {option.deadline}
                          </p>
                        </div>

                        <p className="text-sm sm:text-base text-[var(--gold)]">
                          R$ {option.price.toFixed(2)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
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
                className={`p-5 sm:p-6 rounded-xl border transition text-left ${
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
                className={`p-5 sm:p-6 rounded-xl border transition text-left ${
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

            <div className="rounded-xl border border-white/10 p-4 sm:p-5 bg-black/30">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Digite seu cupom"
                  className="flex-1 border border-white/10 p-3 bg-black rounded-md text-sm"
                  disabled={!!appliedCouponCode}
                />

                {!appliedCouponCode ? (
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    className="px-6 py-3 bg-[var(--gold)] text-black rounded-md text-sm sm:text-base"
                  >
                    {couponLoading ? "Aplicando..." : "Aplicar"}
                  </button>
                ) : (
                  <button
                    onClick={removeCoupon}
                    className="px-6 py-3 border border-white/20 text-white rounded-md text-sm sm:text-base"
                  >
                    Remover
                  </button>
                )}
              </div>

              {appliedCouponCode && (
                <p className="mt-3 text-sm text-green-400">
                  Cupom {appliedCouponCode} aplicado com sucesso.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RESUMO */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-28 p-5 sm:p-6 md:p-8 border border-white/10 rounded-2xl bg-black/40 backdrop-blur">

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

              {discountValue > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Desconto ({appliedCouponCode})</span>
                  <span>- R$ {discountValue.toFixed(2)}</span>
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