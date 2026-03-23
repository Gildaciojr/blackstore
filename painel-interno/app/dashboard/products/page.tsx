"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Product } from "./types/types";

type Category = {
  id: string;
  name: string;
  slug: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    oldPrice: "",
    stock: "",
    image: "",
    categoryId: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  function resolveImage(url: string) {
    if (!url) return "";
    if (url.startsWith("/images")) return url;
    if (url.startsWith("http")) return url;
    return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
  }

  async function loadProducts() {
    const data = await apiFetch<Product[]>("/products");
    setProducts(data);
  }

  async function loadCategories() {
    const data = await apiFetch<Category[]>("/categories");
    setCategories(data);
  }

  async function loadData() {
    await Promise.all([loadProducts(), loadCategories()]);
    setLoading(false);
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadData();
    });
  }, []);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("admin_token");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/upload/product`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      },
    );

    if (!res.ok) throw new Error("Erro no upload");

    const data: { filename: string; url: string } = await res.json();
    return data.url;
  }

  async function handleSubmit() {
    try {
      if (!form.categoryId) {
        alert("Selecione uma categoria");
        return;
      }

      setSaving(true);

      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        price: parseFloat(form.price),
        oldPrice:
          form.oldPrice && parseFloat(form.oldPrice) > 0
            ? parseFloat(form.oldPrice)
            : undefined,
        image: form.image,
        stock: Number(form.stock),
        categoryId: form.categoryId,
      };

      if (editingId) {
        await apiFetch(`/admin/products/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setForm({
        name: "",
        slug: "",
        description: "",
        price: "",
        oldPrice: "",
        stock: "",
        image: "",
        categoryId: "",
      });

      setEditingId(null);
      setImagePreview(null);

      await loadProducts();
    } catch {
      alert("Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(product: Product) {
    setEditingId(product.id);

    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      price: String(product.price),
      oldPrice: product.oldPrice ? String(product.oldPrice) : "",
      stock: String(product.stock),
      image: product.image,
      categoryId: product.categoryId ?? "",
    });

    setImagePreview(resolveImage(product.image));
  }

  if (loading) return <p>Carregando...</p>;

  return (
    <section className="space-y-10">
      {/* HEADER */}
      <div className="space-y-2">
        <p className="text-xs tracking-[0.4em] uppercase text-white/40">
          Admin
        </p>
        <h1 className="text-3xl md:text-5xl font-light mt-2">Produtos</h1>
      </div>

      {/* FORM */}
      <div className="bs-glass p-6 sm:p-8 rounded-3xl border border-white/10 space-y-8">
        <h2 className="text-xl">
          {editingId ? "Editar produto" : "Novo produto"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1 block">
              Nome
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1 block">
              Slug
            </label>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1 block">
              Descrição
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1 block">
              Preço
            </label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1 block">
              Preço antigo
            </label>
            <input
              type="number"
              name="oldPrice"
              value={form.oldPrice}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1 block">
              Estoque
            </label>
            <input
              type="number"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1 block">
              Categoria
            </label>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="input"
            >
              <option value="">Selecionar</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-[0.2em] text-white/50 mb-2 block">
              Imagem
            </label>

            <input
              type="file"
              className="
              w-full
              text-sm
              bg-black/40
              border border-white/20
              rounded-lg
              p-2
              file:mr-4
              file:py-2
              file:px-4
              file:rounded-full
              file:border-0
              file:text-xs
              file:font-semibold
              file:bg-[var(--gold)]
              file:text-black
              hover:file:opacity-90
              "
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                try {
                  setUploading(true);

                  const url = await uploadImage(file);

                  setForm((prev) => ({
                    ...prev,
                    image: url,
                  }));

                  setImagePreview(resolveImage(url));
                } finally {
                  setUploading(false);
                }
              }}
            />

            {uploading && (
              <p className="text-xs text-white/50 mt-2">Enviando imagem...</p>
            )}

            {imagePreview && (
              <img
                src={imagePreview}
                className="mt-4 w-32 h-32 object-cover rounded-lg border border-white/10"
              />
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="
          w-full sm:w-auto
          bg-[var(--gold)]
          text-black
          px-6 py-3
          rounded-full
          font-medium
          hover:scale-[1.02]
          transition
          disabled:opacity-50
          disabled:cursor-not-allowed
          "
        >
          {saving
            ? "Salvando..."
            : editingId
              ? "Atualizar produto"
              : "Criar produto"}
        </button>
      </div>

      {/* LISTA */}
      <div className="space-y-4">
        {products.map((p) => (
          <div
            key={p.id}
            className="
            group
            bg-white/[0.03]
            p-4 sm:p-5
            rounded-2xl
            border border-white/10
            flex flex-col md:flex-row md:items-center justify-between gap-4
            transition
            hover:border-[var(--gold)]
            hover:bg-white/[0.05]
            hover:scale-[1.01]
            "
          >
            <div className="flex gap-4 items-center">
              <img
                src={resolveImage(p.image)}
                className="w-16 h-16 object-cover rounded-lg border border-white/10"
              />
              <div>
                <p className="text-white">{p.name}</p>
                <p className="text-xs text-white/50">{p.slug}</p>
              </div>
            </div>

            <div className="flex gap-6 text-sm text-white/80">
              <span>R$ {p.price}</span>
              <span>{p.stock} un</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleEdit(p)}
                className="
                text-xs
                uppercase
                tracking-[0.2em]
                text-[var(--gold)]
                hover:opacity-80
                "
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
