"use client";

import Image from "next/image";
import { API_URL } from "@/lib/api";

type Props = {
  src: string;
  alt: string;
};

/**
 * 🔥 PADRÃO GLOBAL DE IMAGEM (MESMO DO ProductCard)
 */
function resolveImage(url: string) {
  if (!url) return "/images/placeholder.png";

  if (url.startsWith("http")) return url;

  if (url.startsWith("/images")) return url;

  return `${API_URL}${url}`;
}

export default function ProductImage({ src, alt }: Props) {
  const resolvedSrc = resolveImage(src);

  return (
    <div className="relative w-full aspect-[3/4] overflow-hidden bg-black">

      <Image
        src={resolvedSrc}
        alt={alt}
        fill
        sizes="(max-width:768px) 100vw, 25vw"
        className="
          object-cover
          object-[center_20%]
          transition-transform
          duration-700
          group-hover:scale-[1.06]
        "
      />

    </div>
  );
}