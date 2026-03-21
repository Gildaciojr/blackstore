"use client";

import { useCart } from "@/store/cart";

export default function AddToCartButton({
  id,
  name,
  price,
  image,
}: {
  id: string;
  name: string;
  price: number;
  image: string;
}) {
  const addItem = useCart((s) => s.addItem);

  return (
    <button
      onClick={() => addItem({ id, name, price, image })}
      className="
        w-full mt-5
        py-3 rounded-full
        bg-[var(--gold)] text-black
        text-xs tracking-[0.3em] uppercase font-medium
        hover:scale-105 transition
      "
    >
      Adicionar ao carrinho
    </button>
  );
}