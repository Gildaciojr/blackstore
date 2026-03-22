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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
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

    setImagePreview(resolveImage(product.image));
  }

  if (loading) return <p>Carregando...</p>;

  return (
    <section className="space-y-10">

      {/* HEADER */}
      <div>
        <p className="text-xs tracking-[0.4em] uppercase text-white/40">
          Admin
        </p>
        <h1 className="text-3xl md:text-4xl mt-2">
          Produtos
        </h1>
      </div>

      {/* FORM */}
      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">

        <h2 className="text-xl">
          {editingId ? "Editar produto" : "Novo produto"}
        </h2>

        <div className="grid md:grid-cols-2 gap-4">

          <div>
            <label>Nome</label>
            <input name="name" value={form.name} onChange={handleChange} className="input"/>
          </div>

          <div>
            <label>Slug</label>
            <input name="slug" value={form.slug} onChange={handleChange} className="input"/>
          </div>

          <div className="md:col-span-2">
            <label>Descrição</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="input"/>
          </div>

          <div>
            <label>Preço</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} className="input"/>
          </div>

          <div>
            <label>Preço antigo</label>
            <input type="number" name="oldPrice" value={form.oldPrice} onChange={handleChange} className="input"/>
          </div>

          <div>
            <label>Estoque</label>
            <input type="number" name="stock" value={form.stock} onChange={handleChange} className="input"/>
          </div>

          <div>
            <label>Categoria</label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange} className="input">
              <option value="">Selecionar</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label>Imagem</label>
            <input type="file" onChange={async (e)=>{
              const file = e.target.files?.[0];
              if (!file) return;
              const url = await uploadImage(file);
              setForm(prev => ({...prev, image:url}));
              setImagePreview(resolveImage(url));
            }} />

            {imagePreview && (
              <img src={imagePreview} className="mt-3 w-32 rounded-lg"/>
            )}
          </div>

        </div>

        <button
          onClick={handleSubmit}
          className="bg-[var(--gold)] text-black px-6 py-3 rounded-full"
        >
          {editingId ? "Atualizar" : "Criar"}
        </button>

      </div>

      {/* LISTA MOBILE + DESKTOP */}
      <div className="space-y-4">

        {products.map(p => (
          <div key={p.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">

            <div className="flex gap-4 items-center">
              <img src={resolveImage(p.image)} className="w-16 h-16 object-cover rounded"/>
              <div>
                <p>{p.name}</p>
                <p className="text-xs text-white/50">{p.slug}</p>
              </div>
            </div>

            <div className="flex gap-6 text-sm">
              <span>R$ {p.price}</span>
              <span>{p.stock} un</span>
            </div>

            <div className="flex gap-3">
              <button onClick={()=>handleEdit(p)} className="text-yellow-400">Editar</button>
            </div>

          </div>
        ))}

      </div>

    </section>
  );
}