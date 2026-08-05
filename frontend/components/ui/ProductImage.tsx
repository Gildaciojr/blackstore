"use client";

import Image from "next/image";
import { API_URL } from "@/lib/api";

type Props = {
  src: string;
  alt: string;
  priority?: boolean;
};

/**
 * 🔥 PADRÃO GLOBAL DE IMAGEM (ALINHADO COM ProductCard E QuickView)
 */
function resolveImage(url: string) {
  if (!url) return "/images/placeholder.png";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/images")) return url;

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${API_URL}${normalizedPath}`;
}

export default function ProductImage({ src, alt, priority = false }: Props) {
  const resolvedSrc = resolveImage(src);

  return (
    <div className="relative w-full aspect-[4/5] overflow-hidden bg-neutral-950">
      <Image
        src={resolvedSrc}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="
          object-cover
          object-center
          transition-transform
          duration-700
          ease-out
          hover:scale-105
        "
      />
    </div>
  );
}