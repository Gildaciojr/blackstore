export type ProductMedia = {
  url: string;
};

export type ProductVariant = {
  id?: string;
  size: "PP" | "P" | "M" | "G" | "GG";
  stock: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  oldPrice?: number | null;
  stock: number;
  image: string;
  categoryId: string;

  // 🔥 NOVO (OBRIGATÓRIO)
  medias?: ProductMedia[];
  variants?: ProductVariant[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};
