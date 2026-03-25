export type ProductMedia = {
  url: string;
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
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};
