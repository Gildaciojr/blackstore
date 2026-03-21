import Link from "next/link";
import { ReactNode } from "react";

export default function Button({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="
        inline-block px-12 py-4 rounded-full
        bg-white text-black text-sm font-medium
        tracking-widest uppercase
        hover:scale-105 transition
      "
    >
      {children}
    </Link>
  );
}