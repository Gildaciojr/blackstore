"use client";

import { useEffect, useRef, useState } from "react";
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

  const uploadedImagesRef = useRef<string[]>([]);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    oldPrice: "",
    stock: "",
    image: "",
    images: [] as string[], // 🔥 NOVO
    categoryId: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  function resolveImage(url: string) {
    if (!url) return "";

    if (url.startsWith("http")) return url;

    if (url.startsWith("/uploads")) {
      return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
    }

    if (url.startsWith("/images")) return url;

    return `${process.env.NEXT_PUBLIC_API_URL}/${url}`;
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

    setForm((prev) => {
      if (name === "name") {
        return {
          ...prev,
          name: value,
          slug: editingId ? prev.slug : generateSlug(value),
        };
      }

      if (name === "slug") {
        return {
          ...prev,
          slug: generateSlug(value),
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  }

  function generateSlug(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-");
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

      if (uploadedImagesRef.current.length === 0) {
        alert("Envie ao menos uma imagem antes de salvar");
        return;
      }

      setSaving(true);

      const payload = {
        name: form.name,
        slug: form.slug || generateSlug(form.name),
        description: form.description || undefined,
        price: parseFloat(form.price),
        oldPrice:
          form.oldPrice && parseFloat(form.oldPrice) > 0
            ? parseFloat(form.oldPrice)
            : undefined,
        image: uploadedImagesRef.current[0],
        stock: Number(form.stock),
        categoryId: form.categoryId,
        medias: [...uploadedImagesRef.current],
      };

      console.log("🔥 PAYLOAD FINAL:", payload);

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

      // 🔥 LIMPEZA CORRETA
      uploadedImagesRef.current = [];

      setForm({
        name: "",
        slug: "",
        description: "",
        price: "",
        oldPrice: "",
        stock: "",
        image: "",
        images: [],
        categoryId: "",
      });

      setEditingId(null);

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

      // 🔥 CORREÇÃO REAL
      images: product.medias?.map((m: { url: string }) => m.url) || [],

      categoryId: product.categoryId ?? "",
    });

    setImagePreview(resolveImage(product.image));
  }

  async function handleDelete(id: string) {
    const confirmed = confirm("Deseja excluir este produto?");
    if (!confirmed) return;

    try {
      await apiFetch(`/admin/products/${id}`, {
        method: "DELETE",
      });

      if (editingId === id) {
        setEditingId(null);
        setImagePreview(null);
        setForm({
          name: "",
          slug: "",
          description: "",
          price: "",
          oldPrice: "",
          stock: "",
          image: "",
          images: [], // 🔥 OK aqui
          categoryId: "",
        });
      }

      await loadProducts();
    } catch {
      alert("Erro ao excluir produto");
    }
  }

  if (loading) return <p>Carregando...</p>;

  return (
    <section
      className="
      w-full
      max-w-6xl
      mx-auto
      mx-auto
      py-6 sm:py-10
      space-y-10
      overflow-x-hidden
      "
    >
      {/* HEADER */}
      <div className="relative space-y-4">
        <div
          className="
    absolute inset-0 blur-3xl opacity-20
    bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.25),transparent_60%)]
    pointer-events-none
  "
        />

        <div className="relative z-10">
          <p className="text-[10px] tracking-[0.5em] uppercase text-white/30">
            Painel Administrativo
          </p>

          <h1
            className="
      text-3xl sm:text-4xl md:text-5xl
      font-light
      leading-tight
      bg-gradient-to-r from-white via-white to-white/60
      bg-clip-text text-transparent
    "
          >
            Gestão de Produtos
          </h1>

          <p className="text-sm text-white/40 max-w-xl mt-2">
            Crie, edite e organize seus produtos com controle total e visual
            premium.
          </p>
        </div>
      </div>

      {/* FORM */}
      <div className="bs-glass p-4 sm:p-6 md:p-8 rounded-3xl border border-white/10 space-y-8 backdrop-blur-xl overflow-hidden">
        <h2 className="text-xl">
          {editingId ? "Editar produto" : "Novo produto"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
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
              Imagens
            </label>

            <input
              type="file"
              multiple
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
                const input = e.target;
                const files = input.files;

                if (!files || files.length === 0) return;

                try {
                  setUploading(true);

                  const uploadedUrls: string[] = [];

                  for (const file of Array.from(files)) {
                    const url = await uploadImage(file);
                    uploadedUrls.push(url);
                  }

                  // 🔥 CORREÇÃO DEFINITIVA
                  uploadedImagesRef.current = [
                    ...uploadedImagesRef.current,
                    ...uploadedUrls,
                  ];

                  setForm((prev) => ({
                    ...prev,
                    image: uploadedImagesRef.current[0] || "",
                    images: [...uploadedImagesRef.current],
                  }));
                } finally {
                  setUploading(false);
                  input.value = "";
                }
              }}
            />

            {uploading && (
              <p className="text-xs text-white/50 mt-2">Enviando imagens...</p>
            )}

            {/* PREVIEW PRINCIPAL */}
            {form.images.length > 0 && (
              <img
                src={resolveImage(form.images[0])}
                className="mt-4 w-32 h-32 object-cover rounded-lg border border-white/10"
              />
            )}

            {/* GALERIA DE IMAGENS */}
            {form.images.length > 0 && (
              <div className="flex gap-2 mt-4 flex-wrap">
                {form.images.map((img, i) => (
                  <div key={i} className="relative">
                    <img
                      src={resolveImage(img)}
                      className="w-20 h-20 object-cover rounded-lg border border-white/10"
                    />

                    {/* BOTÃO REMOVER */}
                    <button
                      type="button"
                      onClick={() => {
                        // 🔥 REMOVE DO REF (FONTE REAL)
                        uploadedImagesRef.current =
                          uploadedImagesRef.current.filter(
                            (_, index) => index !== i,
                          );

                        // 🔥 SINCRONIZA COM O STATE
                        setForm((prev) => ({
                          ...prev,
                          images: [...uploadedImagesRef.current],
                          image: uploadedImagesRef.current[0] || "",
                        }));
                      }}
                      className="
  absolute -top-2 -right-2
  bg-red-500 text-white
  text-xs
  rounded-full
  w-5 h-5
  flex items-center justify-center
  hover:bg-red-600
  transition
  "
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
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
            relative
            bg-white/[0.03]
            p-4 sm:p-5
            rounded-2xl
            border border-white/10
            flex flex-col md:flex-row md:items-center justify-between gap-4
            transition
            hover:border-[var(--gold)]
            hover:bg-white/[0.05]
            hover:scale-[1.01]
            hover:shadow-[0_0_30px_rgba(212,175,55,0.08)]
            "
          >
            <div
              className="
              absolute inset-0 opacity-0 group-hover:opacity-100 transition
              bg-[radial-gradient(circle_at_80%_20%,rgba(212,175,55,0.08),transparent_60%)]
              pointer-events-none
              "
            />

            <div className="flex gap-4 items-center relative">
              <img
                src={resolveImage(p.image)}
                alt={p.name}
                className="
                w-16 h-16 object-cover rounded-lg border border-white/10
                group-hover:scale-[1.05]
                transition
                "
              />
              <div>
                <p className="text-white font-medium">{p.name}</p>
                <p className="text-xs text-white/50">{p.slug}</p>
              </div>
            </div>

            <div className="flex gap-6 text-sm text-white/80 relative">
              <span className="font-medium text-white">
                R${" "}
                {p.price.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span>{p.stock} un</span>
            </div>

            <div className="flex gap-4 items-center relative">
              <button
                onClick={() => handleEdit(p)}
                className="
                text-xs
                uppercase
                tracking-[0.2em]
                text-[var(--gold)]
                hover:opacity-80
                transition
                "
              >
                Editar
              </button>

              <button
                onClick={() => handleDelete(p.id)}
                className="
                text-xs
                uppercase
                tracking-[0.2em]
                text-red-400
                hover:text-red-300
                transition
                "
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
