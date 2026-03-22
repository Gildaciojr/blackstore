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
      p-6 sm:p-8
      border border-white/10
      space-y-8
      "
    >

      {/* HEADER */}
      <div className="space-y-2">

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

        <p className="text-xs text-white/40">
          Preencha todas as informações do produto
        </p>

      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1 block">
            Nome
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do produto"
            className="input"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1 block">
            Slug
          </label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Slug (url)"
            className="input"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1 block">
            Descrição
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição"
            className="input"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1 block">
            Preço
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            placeholder="Preço"
            className="input"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1 block">
            Preço antigo
          </label>
          <input
            type="number"
            value={oldPrice ?? ""}
            onChange={(e) => setOldPrice(Number(e.target.value))}
            placeholder="Preço antigo"
            className="input"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1 block">
            Estoque
          </label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            placeholder="Estoque"
            className="input"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1 block">
            Categoria
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input"
          >

            <option value="">Categoria</option>

            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}

          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1 block">
            URL da imagem
          </label>
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://..."
            className="input"
          />
        </div>

      </div>

      {/* ACTIONS */}
      <div className="flex flex-col sm:flex-row gap-4">

        <button
          type="submit"
          disabled={saving}
          className="
          w-full sm:w-auto
          bg-[var(--gold)]
          text-black
          px-6
          py-3
          rounded-full
          text-xs
          tracking-[0.3em]
          uppercase
          hover:scale-[1.03]
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
            w-full sm:w-auto
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