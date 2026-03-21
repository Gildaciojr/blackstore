"use client";

import { useEffect, useState } from "react";

type ProductPayload = {
  name: string;
  price: number;
  stock: number;
  categoryId: string;
};

type Props = {
  editing: ProductPayload | null;
  categories: { id: string; name: string }[];
  onSave: (data: ProductPayload) => Promise<void>;
  onCancel: () => void;
};

export default function ProductForm({
  editing,
  categories,
  onSave,
  onCancel,
}: Props) {

  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);

  /**
   * Sincroniza o formulário quando muda o produto em edição
   */
  useEffect(() => {

    if (editing) {

      setName(editing.name);
      setPrice(editing.price);
      setStock(editing.stock);
      setCategoryId(editing.categoryId);

    } else {

      setName("");
      setPrice(0);
      setStock(0);
      setCategoryId("");

    }

  }, [editing]);

  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault();

    if (!name.trim()) {
      alert("Nome obrigatório");
      return;
    }

    if (!categoryId) {
      alert("Selecione uma categoria");
      return;
    }

    try {

      setSaving(true);

      await onSave({
        name,
        price,
        stock,
        categoryId,
      });

    } finally {

      setSaving(false);

    }

  }

  return (

    <form
      onSubmit={handleSubmit}
      className="
      bs-glass
      rounded-3xl
      p-8
      border border-white/10
      space-y-8
      "
    >

      {/* HEADER */}

      <div>

        <h2 className="text-2xl font-light">

          {editing ? (
            <>
              Editar <span className="bs-title">produto</span>
            </>
          ) : (
            <>
              Novo <span className="bs-title">produto</span>
            </>
          )}

        </h2>

        <p className="text-xs text-white/40 mt-1">
          Preencha as informações do produto
        </p>

      </div>

      {/* FORM GRID */}

      <div className="grid md:grid-cols-2 gap-6">

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do produto"
          className="
          bg-white/5
          border border-white/10
          rounded-xl
          p-3
          focus:border-(--gold)
          outline-none
          "
        />

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="
          bg-white/5
          border border-white/10
          rounded-xl
          p-3
          focus:border-(--gold)
          outline-none
          "
        >

          <option value="">Categoria</option>

          {categories.map((c) => (

            <option key={c.id} value={c.id}>
              {c.name}
            </option>

          ))}

        </select>

        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          placeholder="Preço"
          className="
          bg-white/5
          border border-white/10
          rounded-xl
          p-3
          focus:border-(--gold)
          outline-none
          "
        />

        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          placeholder="Estoque"
          className="
          bg-white/5
          border border-white/10
          rounded-xl
          p-3
          focus:border-(--gold)
          outline-none
          "
        />

      </div>

      {/* ACTIONS */}

      <div className="flex gap-4">

        <button
          type="submit"
          disabled={saving}
          className="
          bg-(--gold)
          text-black
          px-6
          py-3
          rounded-full
          text-xs
          tracking-[0.3em]
          uppercase
          hover:scale-105
          transition
          disabled:opacity-50
          disabled:cursor-not-allowed
          "
        >

          {saving
            ? "Salvando..."
            : editing
            ? "Atualizar"
            : "Criar"
          }

        </button>

        {editing && (

          <button
            type="button"
            onClick={onCancel}
            className="
            border border-white/20
            px-6
            py-3
            rounded-full
            text-xs
            tracking-[0.3em]
            uppercase
            hover:border-white
            transition
            "
          >
            Cancelar
          </button>

        )}

      </div>

    </form>

  );
}