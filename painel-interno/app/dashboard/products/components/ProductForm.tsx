"use client";

import { useEffect, useState } from "react";

type ProductPayload = {
  name: string;
  slug: string;
  description?: string;
  price: number;
  oldPrice?: number;
  stock: number;
  image: string;
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
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [oldPrice, setOldPrice] = useState<number | undefined>(undefined);
  const [stock, setStock] = useState(0);
  const [image, setImage] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);

  /**
   * sincroniza edição
   */
  useEffect(() => {

    if (editing) {

      setName(editing.name);
      setSlug(editing.slug);
      setDescription(editing.description ?? "");
      setPrice(editing.price);
      setOldPrice(editing.oldPrice);
      setStock(editing.stock);
      setImage(editing.image);
      setCategoryId(editing.categoryId);

    } else {

      setName("");
      setSlug("");
      setDescription("");
      setPrice(0);
      setOldPrice(undefined);
      setStock(0);
      setImage("");
      setCategoryId("");

    }

  }, [editing]);

  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault();

    if (!name.trim()) {
      alert("Nome obrigatório");
      return;
    }

    if (!slug.trim()) {
      alert("Slug obrigatório");
      return;
    }

    if (!categoryId) {
      alert("Selecione uma categoria");
      return;
    }

    if (!image) {
      alert("Imagem obrigatória");
      return;
    }

    try {

      setSaving(true);

      await onSave({
        name,
        slug,
        description,
        price,
        oldPrice,
        stock,
        image,
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
          Preencha todas as informações do produto
        </p>

      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-2 gap-6">

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do produto"
          className="bg-white/5 border border-white/10 rounded-xl p-3 outline-none"
        />

        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Slug (url)"
          className="bg-white/5 border border-white/10 rounded-xl p-3 outline-none"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição"
          className="bg-white/5 border border-white/10 rounded-xl p-3 outline-none md:col-span-2"
        />

        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          placeholder="Preço"
          className="bg-white/5 border border-white/10 rounded-xl p-3 outline-none"
        />

        <input
          type="number"
          value={oldPrice ?? ""}
          onChange={(e) => setOldPrice(Number(e.target.value))}
          placeholder="Preço antigo"
          className="bg-white/5 border border-white/10 rounded-xl p-3 outline-none"
        />

        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          placeholder="Estoque"
          className="bg-white/5 border border-white/10 rounded-xl p-3 outline-none"
        />

        <input
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="URL da imagem"
          className="bg-white/5 border border-white/10 rounded-xl p-3 outline-none"
        />

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl p-3 outline-none"
        >

          <option value="">Categoria</option>

          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}

        </select>

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