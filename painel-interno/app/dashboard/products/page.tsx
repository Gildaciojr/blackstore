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

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: 0,
    oldPrice: 0,
    stock: 0,
    image: "",
    categoryId: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);

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
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) {

    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]:
        name === "price" ||
        name === "oldPrice" ||
        name === "stock"
          ? Number(value)
          : value,
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    if (!res.ok) {
      throw new Error("Erro no upload");
    }

    const data: { filename: string; url: string } = await res.json();

    return data.url;
  }

  async function handleSubmit() {

    try {

      if (!form.categoryId) {
        alert("Selecione uma categoria");
        return;
      }

      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        price: form.price,
        oldPrice: form.oldPrice > 0 ? form.oldPrice : undefined,
        image: form.image,
        stock: form.stock,
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
        price: 0,
        oldPrice: 0,
        stock: 0,
        image: "",
        categoryId: "",
      });

      setEditingId(null);
      setImagePreview(null);

      await loadProducts();

    } catch {

      alert("Erro ao salvar produto");

    }

  }

  async function handleDelete(id: string) {

    if (!confirm("Excluir produto?")) return;

    await apiFetch(`/admin/products/${id}`, {
      method: "DELETE",
    });

    await loadProducts();
  }

  function handleEdit(product: Product) {

    setEditingId(product.id);

    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      price: product.price,
      oldPrice: product.oldPrice ?? 0,
      stock: product.stock,
      image: product.image,
      categoryId: product.categoryId ?? "",
    });

    setImagePreview(
      `${process.env.NEXT_PUBLIC_API_URL}${product.image}`
    );
  }

  if (loading) {
    return <p className="text-white/60">Carregando produtos...</p>;
  }

  return (

    <section className="space-y-12">

      {/* HEADER */}

      <div>

        <p className="text-xs tracking-[0.4em] uppercase text-white/40">
          Blackstore Admin
        </p>

        <h1 className="text-4xl font-light mt-3">
          Gestão de <span className="bs-title">produtos</span>
        </h1>

      </div>


      {/* FORM */}

      <div className="bs-glass rounded-3xl p-8 border border-white/10">

        <h2 className="text-2xl mb-8 font-light">

          {editingId
            ? <>Editar <span className="bs-title">produto</span></>
            : <>Novo <span className="bs-title">produto</span></>
          }

        </h2>

        <div className="grid md:grid-cols-2 gap-5">

          <input
            name="name"
            placeholder="Nome do produto"
            value={form.name}
            onChange={handleChange}
            className="bg-white/5 border border-white/10 rounded-xl p-3 focus:border-(--gold) outline-none"
          />

          <input
            name="slug"
            placeholder="Slug"
            value={form.slug}
            onChange={handleChange}
            className="bg-white/5 border border-white/10 rounded-xl p-3 focus:border-(--gold) outline-none"
          />

          <textarea
            name="description"
            placeholder="Descrição"
            value={form.description}
            onChange={handleChange}
            className="bg-white/5 border border-white/10 rounded-xl p-3 col-span-2 min-h-30"
          />

          <input
            name="price"
            type="number"
            placeholder="Preço"
            value={form.price}
            onChange={handleChange}
            className="bg-white/5 border border-white/10 rounded-xl p-3"
          />

          <input
            name="oldPrice"
            type="number"
            placeholder="Preço promocional"
            value={form.oldPrice}
            onChange={handleChange}
            className="bg-white/5 border border-white/10 rounded-xl p-3"
          />

          <input
            name="stock"
            type="number"
            placeholder="Estoque"
            value={form.stock}
            onChange={handleChange}
            className="bg-white/5 border border-white/10 rounded-xl p-3"
          />

          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            className="bg-white/5 border border-white/10 rounded-xl p-3"
          >
            <option value="">Selecionar categoria</option>

            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* IMAGE */}

          <div className="col-span-2">

            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {

                const file = e.target.files?.[0];

                if (!file) return;

                try {

                  const url = await uploadImage(file);

                  setForm(prev => ({
                    ...prev,
                    image: url,
                  }));

                  setImagePreview(
                    `${process.env.NEXT_PUBLIC_API_URL}${url}`
                  );

                } catch {

                  alert("Erro ao enviar imagem");

                }

              }}
            />

            {imagePreview && (

              <img
                src={imagePreview}
                alt="Preview"
                className="mt-4 w-40 rounded-xl border border-white/10"
              />

            )}

          </div>

        </div>

        <button
          onClick={handleSubmit}
          className="
          mt-8
          px-8 py-3
          bg-(--gold)
          text-black
          rounded-full
          text-xs
          tracking-[0.3em]
          uppercase
          hover:scale-105
          transition
          "
        >

          {editingId ? "Atualizar" : "Criar"}

        </button>

      </div>


      {/* TABLE */}

      <div className="bs-glass rounded-3xl border border-white/10 overflow-hidden">

        <table className="w-full">

          <thead>

            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.3em] text-white/50">

              <th className="p-5 text-left">Produto</th>
              <th className="p-5 text-left">Preço</th>
              <th className="p-5 text-left">Promoção</th>
              <th className="p-5 text-left">Estoque</th>
              <th className="p-5 text-left">Ações</th>

            </tr>

          </thead>

          <tbody>

            {products.map(product => (

              <tr
                key={product.id}
                className="border-b border-white/10 hover:bg-white/5 transition"
              >

                <td className="p-5">

                  <div className="flex items-center gap-4">

                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}${product.image}`}
                      alt={product.name}
                      className="w-14 h-14 object-cover rounded-lg"
                    />

                    <div>

                      <p>{product.name}</p>

                      <p className="text-xs text-white/50">
                        {product.slug}
                      </p>

                    </div>

                  </div>

                </td>

                <td className="p-5">
                  R$ {product.price}
                </td>

                <td className="p-5">
                  {product.oldPrice
                    ? `R$ ${product.oldPrice}`
                    : "-"
                  }
                </td>

                <td className="p-5">
                  {product.stock}
                </td>

                <td className="p-5 flex gap-4">

                  <button
                    onClick={() => handleEdit(product)}
                    className="text-(--gold) text-xs uppercase tracking-[0.2em]"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-400 text-xs uppercase tracking-[0.2em]"
                  >
                    Excluir
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </section>

  );
}