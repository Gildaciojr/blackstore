"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";

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

type AddressForm = {
  name: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
};

type AddressFormErrors = Partial<Record<keyof AddressForm, string>>;

const EMPTY_FORM: AddressForm = {
  name: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  zipCode: "",
};

const BRAZIL_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

function getCustomerId() {
  const id = localStorage.getItem("bs_customer");

  if (!id) {
    throw new Error("Sessão inválida. Faça login novamente.");
  }

  return id;
}

function normalizeZipCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

function formatZipCode(value: string) {
  const digits = normalizeZipCode(value);

  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  return digits;
}

function validateAddressForm(form: AddressForm): AddressFormErrors {
  const errors: AddressFormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Informe um nome para identificar o endereço.";
  }

  const normalizedZipCode = normalizeZipCode(form.zipCode);

  if (!normalizedZipCode) {
    errors.zipCode = "Informe o CEP.";
  } else if (normalizedZipCode.length !== 8) {
    errors.zipCode = "O CEP deve conter 8 números.";
  }

  if (!form.street.trim()) {
    errors.street = "Informe a rua ou avenida.";
  }

  if (!form.number.trim()) {
    errors.number = "Informe o número.";
  }

  if (!form.district.trim()) {
    errors.district = "Informe o bairro.";
  }

  if (!form.city.trim()) {
    errors.city = "Informe a cidade.";
  }

  if (!form.state.trim()) {
    errors.state = "Selecione a UF.";
  } else if (form.state.trim().length !== 2) {
    errors.state = "A UF deve conter 2 caracteres.";
  }

  return errors;
}

export default function AddressesPage() {
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<AddressFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const loadAddresses = useCallback(async () => {
    try {
      setLoadingAddresses(true);

      const customerId = getCustomerId();

      const data = await apiFetch<Address[]>(`/address/${customerId}`);

      setAddresses(data);
    } catch (error) {
      console.error("Erro ao carregar endereços:", error);

      const message =
        error instanceof Error ? error.message : "Erro ao carregar endereços.";

      setFormError(message);

      if (message.toLowerCase().includes("sessão")) {
        router.replace("/login?redirect=/account/addresses");
      }
    } finally {
      setLoadingAddresses(false);
    }
  }, [router]);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  function updateField(field: keyof AddressForm, value: string) {
    const nextValue =
      field === "zipCode"
        ? formatZipCode(value)
        : field === "state"
          ? value.toUpperCase().slice(0, 2)
          : value;

    setForm((current) => ({
      ...current,
      [field]: nextValue,
    }));

    setFormErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = {
        ...current,
      };

      delete nextErrors[field];

      return nextErrors;
    });

    if (formError) {
      setFormError(null);
    }
  }

  async function handleSubmit() {
    if (loading) {
      return;
    }

    const errors = validateAddressForm(form);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setFormError(
        "Revise os campos obrigatórios destacados antes de continuar.",
      );

      return;
    }

    let customerId: string;

    try {
      customerId = getCustomerId();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sessão inválida.";

      setFormError(message);

      router.replace("/login?redirect=/account/addresses");

      return;
    }

    const cleanForm = {
      name: form.name.trim(),
      street: form.street.trim(),
      number: form.number.trim(),
      complement: form.complement.trim(),
      district: form.district.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      zipCode: normalizeZipCode(form.zipCode),
    };

    try {
      setLoading(true);
      setFormError(null);

      if (editingId) {
        await apiFetch(`/address/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(cleanForm),
        });
      } else {
        await apiFetch("/address", {
          method: "POST",
          body: JSON.stringify({
            ...cleanForm,
            customerId,
          }),
        });
      }

      setForm(EMPTY_FORM);
      setFormErrors({});
      setEditingId(null);

      await loadAddresses();
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);

      setFormError(
        error instanceof Error
          ? error.message
          : "Erro ao salvar endereço. Verifique os dados informados.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = confirm("Deseja realmente excluir este endereço?");

    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/address/${id}`, {
        method: "DELETE",
      });

      if (editingId === id) {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFormErrors({});
      }

      await loadAddresses();
    } catch (error) {
      console.error("Erro ao excluir endereço:", error);

      alert(
        error instanceof Error ? error.message : "Erro ao excluir endereço.",
      );
    }
  }

  function handleEdit(address: Address) {
    setEditingId(address.id);
    setFormErrors({});
    setFormError(null);

    setForm({
      name: address.name,
      street: address.street,
      number: address.number,
      complement: address.complement ?? "",
      district: address.district,
      city: address.city,
      state: address.state.toUpperCase(),
      zipCode: formatZipCode(address.zipCode),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormError(null);
  }

  function fieldClass(field: keyof AddressForm) {
    return `
      w-full
      min-w-0
      rounded-xl
      border
      bg-black/60
      px-4
      py-3.5
      text-sm
      text-white
      outline-none
      transition-colors
      placeholder:text-white/30
      disabled:cursor-not-allowed
      disabled:opacity-60
      ${
        formErrors[field]
          ? "border-red-400/70 focus:border-red-400"
          : "border-white/15 focus:border-[var(--gold)]"
      }
    `;
  }

  return (
    <section
      className="
        mx-auto
        w-full
        max-w-5xl
        px-4
        pb-24
        pt-28
        sm:px-6
        sm:pb-28
        sm:pt-32
        md:px-8
        md:pb-32
        md:pt-40
      "
    >
      <div className="mb-10 sm:mb-12 md:mb-16">
        <p
          className="
            mb-3
            text-[10px]
            uppercase
            tracking-[0.35em]
            text-white/40
          "
        >
          Minha conta
        </p>

        <h1
          className="
            bs-title
            text-3xl
            uppercase
            tracking-widest
            sm:text-4xl
            md:text-5xl
          "
        >
          Meus endereços
        </h1>
      </div>

      {/* FORMULÁRIO */}
      <div
        className="
          mb-14
          rounded-2xl
          border
          border-white/10
          bg-white/[0.02]
          p-4
          backdrop-blur-xl
          sm:mb-16
          sm:p-6
          md:mb-20
          md:p-10
        "
      >
        <div
          className="
            mb-6
            flex
            flex-col
            gap-3
            sm:mb-8
            sm:flex-row
            sm:items-start
            sm:justify-between
          "
        >
          <div>
            <h2 className="text-sm uppercase tracking-widest">
              {editingId ? "Editar endereço" : "Novo endereço"}
            </h2>

            <p className="mt-2 text-xs leading-relaxed text-white/45">
              Informe os dados do endereço que será utilizado para suas
              entregas.
            </p>
          </div>

          <p
            className="
              shrink-0
              text-[10px]
              uppercase
              tracking-[0.18em]
              text-white/40
            "
          >
            <span className="text-[var(--gold)]">*</span> Campos obrigatórios
          </p>
        </div>

        {formError && (
          <div
            role="alert"
            className="
              mb-6
              rounded-xl
              border
              border-red-400/30
              bg-red-400/10
              px-4
              py-3
              text-xs
              leading-relaxed
              text-red-300
            "
          >
            {formError}
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div
            className="
              grid
              grid-cols-1
              gap-5
              sm:grid-cols-2
              sm:gap-6
            "
          >
            {/* NOME DO ENDEREÇO */}
            <div className="min-w-0">
              <label
                htmlFor="address-name"
                className="
                  mb-2
                  block
                  text-[10px]
                  uppercase
                  tracking-widest
                  text-white/55
                "
              >
                Nome do endereço <span className="text-[var(--gold)]">*</span>
              </label>

              <input
                id="address-name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Ex: Casa, Trabalho"
                disabled={loading}
                className={fieldClass("name")}
              />

              {formErrors.name && (
                <p className="mt-1.5 text-[10px] text-red-300">
                  {formErrors.name}
                </p>
              )}
            </div>

            {/* CEP */}
            <div className="min-w-0">
              <label
                htmlFor="address-zip-code"
                className="
                  mb-2
                  block
                  text-[10px]
                  uppercase
                  tracking-widest
                  text-white/55
                "
              >
                CEP <span className="text-[var(--gold)]">*</span>
              </label>

              <input
                id="address-zip-code"
                name="zipCode"
                type="text"
                required
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={9}
                value={form.zipCode}
                onChange={(event) => updateField("zipCode", event.target.value)}
                placeholder="00000-000"
                disabled={loading}
                className={fieldClass("zipCode")}
              />

              {formErrors.zipCode && (
                <p className="mt-1.5 text-[10px] text-red-300">
                  {formErrors.zipCode}
                </p>
              )}
            </div>

            {/* RUA */}
            <div className="min-w-0 sm:col-span-2">
              <label
                htmlFor="address-street"
                className="
                  mb-2
                  block
                  text-[10px]
                  uppercase
                  tracking-widest
                  text-white/55
                "
              >
                Rua / Avenida <span className="text-[var(--gold)]">*</span>
              </label>

              <input
                id="address-street"
                name="street"
                type="text"
                required
                autoComplete="address-line1"
                value={form.street}
                onChange={(event) => updateField("street", event.target.value)}
                placeholder="Ex: Avenida Paulista"
                disabled={loading}
                className={fieldClass("street")}
              />

              {formErrors.street && (
                <p className="mt-1.5 text-[10px] text-red-300">
                  {formErrors.street}
                </p>
              )}
            </div>

            {/* NÚMERO */}
            <div className="min-w-0">
              <label
                htmlFor="address-number"
                className="
                  mb-2
                  block
                  text-[10px]
                  uppercase
                  tracking-widest
                  text-white/55
                "
              >
                Número <span className="text-[var(--gold)]">*</span>
              </label>

              <input
                id="address-number"
                name="number"
                type="text"
                required
                value={form.number}
                onChange={(event) => updateField("number", event.target.value)}
                placeholder="Ex: 1000"
                disabled={loading}
                className={fieldClass("number")}
              />

              {formErrors.number && (
                <p className="mt-1.5 text-[10px] text-red-300">
                  {formErrors.number}
                </p>
              )}
            </div>

            {/* COMPLEMENTO */}
            <div className="min-w-0">
              <label
                htmlFor="address-complement"
                className="
                  mb-2
                  block
                  text-[10px]
                  uppercase
                  tracking-widest
                  text-white/55
                "
              >
                Complemento{" "}
                <span className="normal-case tracking-normal text-white/30">
                  (opcional)
                </span>
              </label>

              <input
                id="address-complement"
                name="complement"
                type="text"
                autoComplete="address-line2"
                value={form.complement}
                onChange={(event) =>
                  updateField("complement", event.target.value)
                }
                placeholder="Ex: Apto 42, Bloco B"
                disabled={loading}
                className={fieldClass("complement")}
              />
            </div>

            {/* BAIRRO */}
            <div className="min-w-0">
              <label
                htmlFor="address-district"
                className="
                  mb-2
                  block
                  text-[10px]
                  uppercase
                  tracking-widest
                  text-white/55
                "
              >
                Bairro <span className="text-[var(--gold)]">*</span>
              </label>

              <input
                id="address-district"
                name="district"
                type="text"
                required
                value={form.district}
                onChange={(event) =>
                  updateField("district", event.target.value)
                }
                placeholder="Digite o bairro"
                disabled={loading}
                className={fieldClass("district")}
              />

              {formErrors.district && (
                <p className="mt-1.5 text-[10px] text-red-300">
                  {formErrors.district}
                </p>
              )}
            </div>

            {/* CIDADE */}
            <div className="min-w-0">
              <label
                htmlFor="address-city"
                className="
                  mb-2
                  block
                  text-[10px]
                  uppercase
                  tracking-widest
                  text-white/55
                "
              >
                Cidade <span className="text-[var(--gold)]">*</span>
              </label>

              <input
                id="address-city"
                name="city"
                type="text"
                required
                autoComplete="address-level2"
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
                placeholder="Digite a cidade"
                disabled={loading}
                className={fieldClass("city")}
              />

              {formErrors.city && (
                <p className="mt-1.5 text-[10px] text-red-300">
                  {formErrors.city}
                </p>
              )}
            </div>

            {/* UF */}
            <div className="min-w-0 sm:col-span-2">
              <label
                htmlFor="address-state"
                className="
                  mb-2
                  block
                  text-[10px]
                  uppercase
                  tracking-widest
                  text-white/55
                "
              >
                UF <span className="text-[var(--gold)]">*</span>
              </label>

              <select
                id="address-state"
                name="state"
                required
                autoComplete="address-level1"
                value={form.state}
                onChange={(event) => updateField("state", event.target.value)}
                disabled={loading}
                className={fieldClass("state")}
              >
                <option value="">Selecione a UF</option>

                {BRAZIL_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>

              {formErrors.state && (
                <p className="mt-1.5 text-[10px] text-red-300">
                  {formErrors.state}
                </p>
              )}
            </div>
          </div>

          <div
            className="
              mt-8
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
            "
          >
            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                rounded-full
                bg-[var(--gold)]
                px-6
                py-4
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.22em]
                text-black
                transition
                hover:scale-[1.02]
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-50
                disabled:hover:scale-100
                sm:w-auto
                sm:px-10
                sm:text-xs
                sm:tracking-[0.35em]
              "
            >
              {loading
                ? "Salvando..."
                : editingId
                  ? "Salvar alterações"
                  : "Salvar endereço"}
            </button>

            {editingId && (
              <button
                type="button"
                disabled={loading}
                onClick={handleCancelEdit}
                className="
                  w-full
                  rounded-full
                  border
                  border-white/15
                  px-6
                  py-4
                  text-[10px]
                  uppercase
                  tracking-[0.22em]
                  text-white/70
                  transition
                  hover:border-white/30
                  hover:text-white
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  sm:w-auto
                  sm:text-xs
                "
              >
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      </div>

      {/* LISTA */}
      <div className="space-y-4 sm:space-y-6">
        {loadingAddresses ? (
          <div
            className="
              rounded-2xl
              border
              border-white/10
              p-6
              text-sm
              text-white/50
            "
          >
            Carregando endereços...
          </div>
        ) : addresses.length === 0 ? (
          <div
            className="
              rounded-2xl
              border
              border-white/10
              p-6
              text-sm
              leading-relaxed
              text-white/50
            "
          >
            Você ainda não possui endereços cadastrados.
          </div>
        ) : (
          addresses.map((address) => (
            <div
              key={address.id}
              className="
                flex
                flex-col
                gap-5
                rounded-2xl
                border
                border-white/10
                bg-white/[0.02]
                p-5
                sm:flex-row
                sm:items-center
                sm:justify-between
                sm:p-6
              "
            >
              <div className="min-w-0">
                <p
                  className="
                    mb-2
                    text-[10px]
                    uppercase
                    tracking-[0.25em]
                    text-[var(--gold)]
                  "
                >
                  {address.name}
                </p>

                <p className="break-words text-sm text-white/90">
                  {address.street}, {address.number}
                </p>

                {address.complement && (
                  <p className="mt-1 break-words text-xs text-white/55">
                    {address.complement}
                  </p>
                )}

                <p className="mt-1 break-words text-xs text-white/60">
                  {address.district} — {address.city} - {address.state}
                </p>

                <p className="mt-1 text-xs text-white/60">
                  CEP {formatZipCode(address.zipCode)}
                </p>
              </div>

              <div
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  border-t
                  border-white/10
                  pt-4
                  sm:w-auto
                  sm:border-0
                  sm:pt-0
                "
              >
                <button
                  type="button"
                  onClick={() => handleEdit(address)}
                  className="
                    flex-1
                    text-left
                    text-xs
                    text-white/60
                    transition
                    hover:text-white
                    sm:flex-none
                  "
                >
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() => void handleDelete(address.id)}
                  className="
                    flex-1
                    text-right
                    text-xs
                    text-red-400
                    transition
                    hover:text-red-300
                    sm:flex-none
                  "
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
