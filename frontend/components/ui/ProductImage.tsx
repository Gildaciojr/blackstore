"use client";

import Image from "next/image";

type Props = {
  src: string;
  alt: string;
};

export default function ProductImage({ src, alt }: Props) {
  return (
    <div className="relative w-full aspect-3/4 overflow-hidden bg-black">

      <Image
        src={src}
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