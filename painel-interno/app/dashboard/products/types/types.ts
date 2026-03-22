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
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};