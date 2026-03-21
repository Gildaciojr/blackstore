"use client";

import { useEffect, useState } from "react";
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

export default function AddressesPage() {

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadAddresses() {

    const customerId = getCustomerId();

    const data = await apiFetch<Address[]>(
      `/address/${customerId}`
    );

    setAddresses(data);
  }

  useEffect(() => {
    loadAddresses();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit() {

    const customerId = getCustomerId();

    setLoading(true);

    try {

      if (editingId) {

        await apiFetch(`/address/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });

      } else {

        await apiFetch("/address", {
          method: "POST",
          body: JSON.stringify({
            ...form,
            customerId,
          }),
        });

      }

      setForm({
        name: "",
        street: "",
        number: "",
        complement: "",
        district: "",
        city: "",
        state: "",
        zipCode: "",
      });

      setEditingId(null);

      await loadAddresses();

    } catch {

      alert("Erro ao salvar endereço");

    } finally {

      setLoading(false);

    }

  }

  async function handleDelete(id: string) {

    if (!confirm("Excluir endereço?")) return;

    await apiFetch(`/address/${id}`, {
      method: "DELETE",
    });

    await loadAddresses();
  }

  function handleEdit(address: Address) {

    setEditingId(address.id);

    setForm({
      name: address.name,
      street: address.street,
      number: address.number,
      complement: address.complement || "",
      district: address.district,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
    });

  }

  return (
    <section className="max-w-5xl mx-auto px-8 pt-40 pb-32">

      <h1 className="text-4xl md:text-5xl uppercase tracking-widest mb-16 bs-title">
        Meus endereços
      </h1>

      {/* FORM */}

      <div className="border border-white/10 p-10 mb-20">

        <h2 className="uppercase text-sm tracking-widest mb-8">
          {editingId ? "Editar endereço" : "Novo endereço"}
        </h2>

        <div className="grid grid-cols-2 gap-6">

          <input
            name="name"
            placeholder="Nome do endereço"
            value={form.name}
            onChange={handleChange}
            className="bg-black border border-white/20 p-3"
          />

          <input
            name="zipCode"
            placeholder="CEP"
            value={form.zipCode}
            onChange={handleChange}
            className="bg-black border border-white/20 p-3"
          />

          <input
            name="street"
            placeholder="Rua"
            value={form.street}
            onChange={handleChange}
            className="bg-black border border-white/20 p-3"
          />

          <input
            name="number"
            placeholder="Número"
            value={form.number}
            onChange={handleChange}
            className="bg-black border border-white/20 p-3"
          />

          <input
            name="complement"
            placeholder="Complemento"
            value={form.complement}
            onChange={handleChange}
            className="bg-black border border-white/20 p-3"
          />

          <input
            name="district"
            placeholder="Bairro"
            value={form.district}
            onChange={handleChange}
            className="bg-black border border-white/20 p-3"
          />

          <input
            name="city"
            placeholder="Cidade"
            value={form.city}
            onChange={handleChange}
            className="bg-black border border-white/20 p-3"
          />

          <input
            name="state"
            placeholder="Estado"
            value={form.state}
            onChange={handleChange}
            className="bg-black border border-white/20 p-3"
          />

        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="
            mt-10
            px-10 py-4
            bg-[var(--gold)] text-black
            uppercase text-xs tracking-[0.35em]
            hover:scale-105 transition
          "
        >

          {loading ? "Salvando..." : "Salvar endereço"}

        </button>

      </div>

      {/* LISTA */}

      <div className="space-y-6">

        {addresses.map((address) => (

          <div
            key={address.id}
            className="border border-white/10 p-6 flex justify-between items-center"
          >

            <div>

              <p className="text-sm">
                {address.street}, {address.number}
              </p>

              <p className="text-xs text-white/60">
                {address.city} - {address.state}
              </p>

              <p className="text-xs text-white/60">
                CEP {address.zipCode}
              </p>

            </div>

            <div className="flex gap-4">

              <button
                onClick={() => handleEdit(address)}
                className="text-xs text-white/60 hover:text-white"
              >
                Editar
              </button>

              <button
                onClick={() => handleDelete(address.id)}
                className="text-xs text-red-400"
              >
                Excluir
              </button>

            </div>

          </div>

        ))}

      </div>

    </section>
  );
}