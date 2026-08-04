"use client";

import { useCart } from "@/store/cart";
import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";

type AddToCartButtonProps = {
  id: string;
  name: string;
  price: number;
  image: string;
  selectedSize?: string; // Opcional, caso queira passar a variação de tamanho selecionada
};

export default function AddToCartButton({
  id,
  name,
  price,
  image,
  selectedSize,
}: AddToCartButtonProps) {
  const addItem = useCart((s) => s.addItem);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    // Identificador único considerando o tamanho se houver
    const cartItemId = selectedSize ? `${id}-${selectedSize}` : id;
    
    addItem({ 
      id: cartItemId, 
      name: selectedSize ? `${name} (Tam: ${selectedSize})` : name, 
      price, 
      image 
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={isAdded}
      className={`
        w-full mt-5
        py-3.5 px-6 rounded-full
        text-xs tracking-[0.3em] uppercase font-semibold
        flex items-center justify-center gap-2
        transition-all duration-300 shadow-lg
        ${
          isAdded
            ? "bg-emerald-500 text-black shadow-emerald-500/20 scale-[1.02]"
            : "bg-[var(--gold)] text-black hover:scale-[1.03] active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
        }
      `}
    >
      {isAdded ? (
        <>
          <Check size={16} className="stroke-[3]" />
          Adicionado com sucesso
        </>
      ) : (
        <>
          <ShoppingBag size={16} />
          Adicionar ao carrinho
        </>
      )}
    </button>
  );
}