"use client";

import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Package, ShoppingCart, Layers } from "lucide-react";

export default function AdminSidebar(){

  return(

    <aside
      className="
      hidden lg:flex
      w-72
      flex-col
      border-r border-white/10
      bg-black/60
      backdrop-blur-xl
      "
    >

      {/* BRAND */}

      <div className="px-8 py-10 flex flex-col items-center gap-3">

        <Image
          src="/logo-saray.png"
          alt="Blackstore"
          width={160}
          height={60}
          className="
          opacity-90
          drop-shadow-[0_0_20px_rgba(212,175,55,0.15)]
          "
        />

        <p className="text-xs text-white/40 tracking-[0.35em] uppercase">
          Admin
        </p>

      </div>

      {/* NAV */}

      <nav className="flex flex-col gap-2 px-4">

        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition"
        >
          <LayoutDashboard size={18}/>
          Dashboard
        </Link>

        <Link
          href="/dashboard/products"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition"
        >
          <Package size={18}/>
          Produtos
        </Link>

        <Link
          href="/dashboard/orders"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition"
        >
          <ShoppingCart size={18}/>
          Pedidos
        </Link>

        <Link
          href="/dashboard/categories"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition"
        >
          <Layers size={18}/>
          Categorias
        </Link>

      </nav>

    </aside>

  );

}