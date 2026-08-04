"use client";

import { useCallback, useEffect, useState } from "react";
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

type CustomerProfile = {
  cpf?: string | null;
  phone?: string | null;
}

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

type PaymentPayload = {
  orderId: string;
  method: "pix" | "card";
  cardToken?: string;
  installments?: number;
  holderName?: string;
};

type PagSeguroEncryptCardInput = {
  publicKey: string;
  holder: string;
  number: string;
  expMonth: string;
  expYear: string;
  securityCode: string;
};

type PagSeguroEncryptCardError = {
  code: string;
  message: string;
};

type PagSeguroEncryptCardResult = {
  encryptedCard: string;
  hasErrors: boolean;
  errors?: PagSeguroEncryptCardError[];
};

type PagSeguroSdk = {
  encryptCard: (data: PagSeguroEncryptCardInput) => PagSeguroEncryptCardResult;
};

declare global {
  interface Window {
    PagSeguro?: PagSeguroSdk;
  }
}

// Formatadores
function normalizeCardNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 16);
}

function formatCardNumber(value: string) {
  const digits = normalizeCardNumber(value);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function normalizeExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function normalizeCvv(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

function normalizeInstallments(value: string) {
  const numeric = Number(value.replace(/\D/g, "") || "1");
  if (numeric < 1) return 1;
  if (numeric > 3) return 3;
  return numeric;
}

function normalizeZipCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

// 🔥 NOVO: Formatador de CEP visual para o input do novo endereço
function formatZipCode(value: string) {
  const digits = normalizeZipCode(value);
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits;
}

function formatCPF(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatPhone(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{4,5})(\d{4})$/, "$1-$2");
}

export default function CheckoutPage() {
  const {
    items,
    clear,
    loadCart,
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

  // Dados Pessoais
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  // 🔥 NOVOS ESTADOS: Controle do formulário interno de endereço e ViaCEP
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  const [newAddress, setNewAddress] = useState({
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
  });

  const [payment, setPayment] = useState<"pix" | "card">("pix");
  const [loading, setLoading] = useState(false);

  const [couponCode, setCouponCode] = useState(appliedCouponCode ?? "");
  const [couponLoading, setCouponLoading] = useState(false);

  const [zip, setZip] = useState(zipCode);
  const [shippingLoading, setShippingLoading] = useState(false);

  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [installments, setInstallments] = useState(1);

  const [checkoutLock, setCheckoutLock] = useState(false);

  const loadProfileData = useCallback(async () => {
    try {
      const customerId = getCustomerId();
      const profile = await apiFetch<CustomerProfile>(`/customer/${customerId}/profile`);
      if (profile.cpf) setCpf(formatCPF(profile.cpf));
      if (profile.phone) setPhone(formatPhone(profile.phone));
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
    }
  }, []);

  const loadAddresses = useCallback(async () => {
    try {
      const customerId = getCustomerId();
      const data = await apiFetch<Address[]>(`/address/${customerId}`);
      setAddresses(data);
      
      // Se não tem endereço, abre o formulário automaticamente
      if (data.length === 0) {
        setIsAddingAddress(true);
      }
    } catch (err) {
      console.error(err);
      setAddresses([]);
      setIsAddingAddress(true);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    void loadProfileData();
    void loadAddresses();
  }, [loadProfileData, loadAddresses]);

  useEffect(() => {
    setCouponCode(appliedCouponCode ?? "");
  }, [appliedCouponCode]);

  useEffect(() => {
    setZip(zipCode);
  }, [zipCode]);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress && !isAddingAddress) {
      setSelectedAddress(addresses[0].id);
    }
  }, [addresses, selectedAddress, isAddingAddress]);

  useEffect(() => {
    if (!selectedAddress) return;
    const currentAddress = addresses.find(
      (address) => address.id === selectedAddress,
    );
    if (!currentAddress?.zipCode) return;

    const normalizedAddressZip = normalizeZipCode(currentAddress.zipCode);
    const normalizedCurrentZip = normalizeZipCode(zip);

    if (
      normalizedAddressZip.length === 8 &&
      normalizedAddressZip !== normalizedCurrentZip
    ) {
      setZip(normalizedAddressZip);
    }
  }, [selectedAddress, addresses, zip]);

  useEffect(() => {
    const normalizedZip = normalizeZipCode(zip);
    if (normalizedZip.length !== 8) return;

    void (async () => {
      try {
        setShippingLoading(true);
        await calculateShipping(normalizedZip);
      } catch (err) {
        console.error("Erro ao calcular frete automaticamente:", err);
      } finally {
        setShippingLoading(false);
      }
    })();
  }, [zip, calculateShipping]);

  // 🔥 INTEGRAÇÃO VIACEP
  async function handleCepSearch(value: string) {
    const formatted = formatZipCode(value);
    setNewAddress((prev) => ({ ...prev, zipCode: formatted }));
    
    const cleanCep = normalizeZipCode(value);
    if (cleanCep.length === 8) {
      setSearchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        
        if (!data.erro) {
          setNewAddress((prev) => ({
            ...prev,
            street: data.logradouro || "",
            district: data.bairro || "",
            city: data.localidade || "",
            state: data.uf || "", 
          }));
        }
      } catch (e) {
        console.error("Erro ViaCEP:", e);
      } finally {
        setSearchingCep(false);
      }
    }
  }

  // 🔥 SALVAR NOVO ENDEREÇO
  async function handleSaveNewAddress() {
    if (!newAddress.zipCode || !newAddress.street || !newAddress.number || !newAddress.city || !newAddress.state) {
      alert("Preencha todos os campos obrigatórios do endereço.");
      return;
    }

    try {
      setLoading(true);
      const customerId = getCustomerId();
      
      const payload = {
        name: "Principal",
        street: newAddress.street,
        number: newAddress.number,
        complement: newAddress.complement,
        district: newAddress.district,
        city: newAddress.city,
        state: newAddress.state.toUpperCase(), 
        zipCode: normalizeZipCode(newAddress.zipCode), 
        customerId
      };

      const saved = await apiFetch<Address>("/address", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await loadAddresses();
      setIsAddingAddress(false);
      setSelectedAddress(saved.id);
      
      setNewAddress({ zipCode: "", street: "", number: "", complement: "", district: "", city: "", state: "" });
    } catch (e) {
      alert("Erro ao salvar endereço. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;

    try {
      setCouponLoading(true);
      await applyCoupon(couponCode);
    } catch (err) {
      setCouponCode("");
      alert(err instanceof Error ? err.message : "Erro ao aplicar cupom");
    } finally {
      setCouponLoading(false);
    }
  }

  async function handleCalculateShipping() {
    const normalizedZip = normalizeZipCode(zip);

    if (!normalizedZip) {
      alert("Digite seu CEP");
      return;
    }

    if (normalizedZip.length !== 8) {
      alert("Digite um CEP válido");
      return;
    }

    try {
      setShippingLoading(true);
      await calculateShipping(normalizedZip);
    } catch {
      alert("Erro ao calcular frete");
    } finally {
      setShippingLoading(false);
    }
  }

  function waitForPagSeguro(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = 5000;
      const interval = 100;
      let elapsed = 0;

      const check = () => {
        if (window.PagSeguro) {
          resolve();
        } else {
          elapsed += interval;
          if (elapsed >= timeout) {
            reject(new Error("PagSeguro não carregou"));
          } else {
            setTimeout(check, interval);
          }
        }
      };
      check();
    });
  }

  async function generateCardToken(): Promise<string> {
    await waitForPagSeguro();

    const publicKey = process.env.NEXT_PUBLIC_PAGBANK_PUBLIC_KEY;

    if (!window.PagSeguro) {
      throw new Error("PagSeguro não disponível");
    }

    if (!publicKey) {
      throw new Error("Public key não configurada");
    }

    const [month, shortYear] = cardExpiry.split("/");

    if (!month || !shortYear) {
      throw new Error("Validade do cartão inválida");
    }

    const encrypted = window.PagSeguro.encryptCard({
      publicKey,
      holder: cardName.trim(),
      number: cardNumber.replace(/\s/g, ""),
      expMonth: month,
      expYear: `20${shortYear}`,
      securityCode: cardCvv,
    });

    if (encrypted.hasErrors) {
      throw new Error(
        encrypted.errors?.[0]?.message ?? "Erro ao gerar token do cartão",
      );
    }

    if (!encrypted.encryptedCard) {
      throw new Error("Token do cartão não retornado");
    }

    return encrypted.encryptedCard;
  }

  async function handleCheckout() {
    if (loading || checkoutLock) return;

    const cleanCpf = cpf.replace(/\D/g, "");
    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanCpf.length !== 11) {
      alert("Por favor, preencha um CPF válido.");
      return;
    }

    if (cleanPhone.length < 10) {
      alert("Por favor, preencha um telefone válido com DDD.");
      return;
    }

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

    if (payment === "card") {
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        alert("Preencha todos os dados do cartão");
        return;
      }
      if (normalizeCardNumber(cardNumber).length < 13) {
        alert("Número do cartão inválido");
        return;
      }
      if (!cardExpiry.includes("/") || cardExpiry.length !== 5) {
        alert("Validade do cartão inválida");
        return;
      }
      if (cardCvv.length < 3) {
        alert("CVV inválido");
        return;
      }
    }

    let customerId: string;
    let redirecting = false;

    try {
      customerId = getCustomerId();
    } catch {
      alert("Sessão inválida. Faça login novamente.");
      return;
    }

    try {
      setLoading(true);
      setCheckoutLock(true);

      // 1. Atualizar perfil com CPF e Telefone (Exigência PagBank)
      await apiFetch(`/customer/${customerId}/profile`, {
        method: "PATCH",
        body: JSON.stringify({ cpf: cleanCpf, phone: cleanPhone }),
      });

      // 2. Criar Pedido
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

      // 3. Processar Pagamento
      const payload: PaymentPayload = {
        orderId: order.id,
        method: payment,
      };

      if (payment === "card") {
        const token = await generateCardToken();
        payload.cardToken = token;
        payload.installments = installments;
        payload.holderName = cardName.trim();
      }

      const paymentData = await apiFetch<PaymentResponse>("/payment", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!paymentData?.orderId) {
        throw new Error("Falha ao criar pagamento");
      }

      clear();
      redirecting = true;

      setTimeout(() => {
        window.location.href = `/payment/${paymentData.orderId}`;
      }, 1200);

      return;
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Erro ao finalizar checkout";
      alert(message);
      setCheckoutLock(false);
      setLoading(false);
    } finally {
      if (!redirecting) {
        setLoading(false);
      }
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
          {/* DADOS PESSOAIS */}
          <div>
            <h2 className="uppercase tracking-widest text-xs mb-6">
              Dados Pessoais
            </h2>
            <div className="rounded-xl border border-white/10 p-4 sm:p-5 bg-black/40 backdrop-blur-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">
                    CPF
                  </label>
                  <input
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full bg-black border border-white/20 p-3 rounded-md text-sm"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">
                    Telefone
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-black border border-white/20 p-3 rounded-md text-sm"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <p className="text-[10px] text-white/40 mt-3">
                * Dados obrigatórios para emissão de nota fiscal e segurança do
                pagamento.
              </p>
            </div>
          </div>

          {/* ENDEREÇO (REFORMULADO) */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="uppercase tracking-widest text-xs">
                Endereço de entrega
              </h2>
              {addresses.length > 0 && !isAddingAddress && (
                <button
                  onClick={() => setIsAddingAddress(true)}
                  className="text-[10px] uppercase tracking-widest text-[var(--gold)]"
                >
                  + Adicionar Novo
                </button>
              )}
            </div>

            {isAddingAddress ? (
              <div className="rounded-xl border border-[var(--gold)]/30 p-4 sm:p-5 bg-[var(--gold)]/5 backdrop-blur-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase tracking-widest text-[var(--gold)]/80 mb-2">
                        CEP
                      </label>
                      <input
                        value={newAddress.zipCode}
                        onChange={(e) => handleCepSearch(e.target.value)}
                        placeholder="00000-000"
                        className="w-full bg-black border border-white/20 p-3 rounded-md text-sm focus:border-[var(--gold)] transition-colors"
                        inputMode="numeric"
                        maxLength={9}
                      />
                    </div>
                    {searchingCep && (
                      <div className="text-xs text-[var(--gold)] mb-3 animate-pulse">
                        Buscando...
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">
                      Rua / Avenida
                    </label>
                    <input
                      value={newAddress.street}
                      onChange={(e) => setNewAddress((prev) => ({...prev, street: e.target.value}))}
                      placeholder="Ex: Avenida Paulista"
                      className="w-full bg-black border border-white/20 p-3 rounded-md text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">
                      Número
                    </label>
                    <input
                      value={newAddress.number}
                      onChange={(e) => setNewAddress((prev) => ({...prev, number: e.target.value}))}
                      placeholder="Ex: 1000"
                      className="w-full bg-black border border-white/20 p-3 rounded-md text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">
                      Complemento
                    </label>
                    <input
                      value={newAddress.complement}
                      onChange={(e) => setNewAddress((prev) => ({...prev, complement: e.target.value}))}
                      placeholder="Ex: Apto 42"
                      className="w-full bg-black border border-white/20 p-3 rounded-md text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">
                      Bairro
                    </label>
                    <input
                      value={newAddress.district}
                      onChange={(e) => setNewAddress((prev) => ({...prev, district: e.target.value}))}
                      className="w-full bg-black border border-white/20 p-3 rounded-md text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">
                        Cidade
                      </label>
                      <input
                        value={newAddress.city}
                        onChange={(e) => setNewAddress((prev) => ({...prev, city: e.target.value}))}
                        className="w-full bg-black border border-white/20 p-3 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">
                        UF
                      </label>
                      <select
                        value={newAddress.state}
                        onChange={(e) => setNewAddress((prev) => ({...prev, state: e.target.value}))}
                        className="w-full bg-black border border-white/20 p-3 rounded-md text-sm h-[46px]"
                      >
                        <option value="">UF</option>
                        {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                          <option key={uf} value={uf}>{uf}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSaveNewAddress}
                    disabled={loading}
                    className="
                      px-6 py-3 bg-[var(--gold)] text-black text-xs uppercase tracking-widest rounded-md 
                      hover:scale-105 active:scale-[0.98] transition-all
                    "
                  >
                    {loading ? "Salvando..." : "Salvar Endereço"}
                  </button>
                  {addresses.length > 0 && (
                    <button
                      onClick={() => setIsAddingAddress(false)}
                      className="
                        px-6 py-3 border border-white/20 text-white text-xs uppercase tracking-widest rounded-md 
                        hover:border-white/50 transition-colors
                      "
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <button
                    key={address.id}
                    onClick={() => setSelectedAddress(address.id)}
                    className={`
                      w-full text-left p-4 sm:p-5 rounded-xl border transition
                      ${
                        selectedAddress === address.id
                          ? "border-[var(--gold)] bg-white/[0.02]"
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

                    <p className="text-xs text-white/60 mt-1">
                      {address.district} - {address.city} - {address.state}
                    </p>

                    <p className="text-xs text-white/60 mt-1">
                      CEP {address.zipCode}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* FRETE */}
          <div>
            <h2 className="uppercase tracking-widest text-xs mb-6">Frete</h2>

            <div className="rounded-xl border border-white/10 p-4 sm:p-5 bg-black/40 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={zip}
                  onChange={(e) =>
                    setZip(e.target.value.replace(/\D/g, "").slice(0, 8))
                  }
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

              {shippingLoading && (
                <p className="text-xs text-white/50 mt-3">
                  Buscando opções de frete...
                </p>
              )}

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
                            ? "border-[var(--gold)] bg-white/[0.02]"
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
                    ? "border-[var(--gold)] bg-white/[0.02]"
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
                    ? "border-[var(--gold)] bg-white/[0.02]"
                    : "border-white/10"
                }`}
              >
                <p className="uppercase tracking-widest text-xs mb-2">Cartão</p>
                <p className="text-white/60 text-sm">Integração via PagBank.</p>
              </button>
            </div>

            {payment === "card" && (
              <div className="mt-6 space-y-4">
                <input
                  placeholder="Número do cartão"
                  value={cardNumber}
                  onChange={(e) =>
                    setCardNumber(formatCardNumber(e.target.value))
                  }
                  className="w-full h-11 px-4 bg-black/60 border border-white/15 rounded-md"
                  inputMode="numeric"
                  autoComplete="cc-number"
                />

                <input
                  placeholder="Nome no cartão"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full h-11 px-4 bg-black/60 border border-white/15 rounded-md"
                  autoComplete="cc-name"
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="MM/AA"
                    value={cardExpiry}
                    onChange={(e) =>
                      setCardExpiry(normalizeExpiry(e.target.value))
                    }
                    className="p-3 bg-black border border-white/10 rounded-md"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                  />

                  <input
                    placeholder="CVV"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(normalizeCvv(e.target.value))}
                    className="p-3 bg-black border border-white/10 rounded-md"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
                    Parcelamento
                  </label>

                  <select
                    value={installments}
                    onChange={(e) =>
                      setInstallments(normalizeInstallments(e.target.value))
                    }
                    className="w-full p-3 bg-black border border-white/10 rounded-md text-sm"
                  >
                    <option value={1}>1x sem juros</option>
                    <option value={2}>2x sem juros</option>
                    <option value={3}>3x sem juros</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* CUPOM */}
          <div>
            <h2 className="uppercase tracking-widest text-xs mb-6">
              Cupom de desconto
            </h2>

            <div className="rounded-xl border border-white/10 p-4 sm:p-5 bg-black/40 backdrop-blur-xl">
              <p className="text-[10px] uppercase tracking-widest text-white/50 mb-2">
                Possui um cupom?
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
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
                    disabled={couponLoading}
                    className="
                      px-6 py-3 text-xs uppercase tracking-widest
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
                      px-6 py-3 text-xs uppercase tracking-widest
                      border border-white/20 rounded-md
                      hover:border-red-400 hover:text-red-400 transition
                    "
                  >
                    Remover
                  </button>
                )}
              </div>

              {appliedCouponCode && (
                <div className="mt-4 p-3 rounded-md border border-green-500/30 bg-green-500/10">
                  <p className="text-green-400 text-sm">
                    Cupom <strong>{appliedCouponCode}</strong> aplicado
                  </p>

                  <p className="text-xs text-green-300 mt-1">
                    Você economizou R$ {discountValue.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>{" "}
        {/* FECHA COLUNA */}

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-28 p-5 sm:p-6 md:p-8 border border-white/10 rounded-2xl bg-black/40 backdrop-blur-xl">
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
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex justify-between text-green-400 text-sm">
                    <span>Desconto aplicado</span>
                    <span>- R$ {discountValue.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-green-300/80">
                    <span>Cupom</span>
                    <span>{appliedCouponCode}</span>
                  </div>
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
              disabled={
                loading ||
                checkoutLock ||
                !selectedAddress ||
                !selectedShipping ||
                items.length === 0
              }
              className={`
                relative w-full mt-8 py-4 rounded-full text-xs tracking-[0.35em] uppercase
                transition-all duration-300 overflow-hidden
                ${
                  loading || checkoutLock || !selectedAddress || !selectedShipping || items.length === 0
                    ? "bg-[var(--gold)] opacity-50 cursor-not-allowed"
                    : "bg-[var(--gold)] text-black hover:scale-[1.02] active:scale-[0.98]"
                }
              `}
            >
              <span
                className={`
                  transition-opacity duration-200
                  ${loading ? "opacity-0" : "opacity-100"}
                `}
              >
                Finalizar compra
              </span>

              {loading && (
                <div className="absolute inset-0 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce delay-150" />
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce delay-300" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-14 h-14 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />

            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
              Processando pedido
            </p>
          </div>
        </div>
      )}
    </section>
  );
}