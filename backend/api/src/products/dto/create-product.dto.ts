export class CreateProductDto {
  name: string;
  slug: string;
  description?: string;
  price: number;
  oldPrice?: number;
  image: string;
  stock: number;
  categoryId: string;
}
