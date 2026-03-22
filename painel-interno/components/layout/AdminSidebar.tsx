"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Layers,
  Menu,
  X,
} from "lucide-react";

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 🔥 MOBILE HEADER */}
      <div className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-white/10 bg-black/80 backdrop-blur z-50">

        <Image
          src="/logo-saray.png"
          alt="Blackstore"
          width={120}
          height={40}
        />

        <button onClick={() => setOpen(true)}>
          <Menu />
        </button>
      </div>

      {/* 🔥 OVERLAY */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
        />
      )}

      {/* 🔥 DRAWER MOBILE */}
      <aside
        className={`
        fixed top-0 left-0 h-full w-72 bg-black z-50
        transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:hidden
        `}
      >
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
          <Image
            src="/logo-saray.png"
            alt="Blackstore"
            width={120}
            height={40}
          />

          <button onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>

        <nav className="flex flex-col gap-2 px-4 py-6">

          <NavItem href="/dashboard" icon={<LayoutDashboard size={18}/>}>
            Dashboard
          </NavItem>

          <NavItem href="/dashboard/products" icon={<Package size={18}/>}>
            Produtos
          </NavItem>

          <NavItem href="/dashboard/orders" icon={<ShoppingCart size={18}/>}>
            Pedidos
          </NavItem>

          <NavItem href="/dashboard/categories" icon={<Layers size={18}/>}>
            Categorias
          </NavItem>

        </nav>
      </aside>

      {/* 🔥 SIDEBAR DESKTOP (SEU ORIGINAL MELHORADO) */}
      <aside
        className="
        hidden lg:flex
        w-72
        flex-col
        border-r border-white/10
        bg-black/60
        backdrop-blur-xl
        min-h-screen
        "
      >

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

        <nav className="flex flex-col gap-2 px-4">

          <NavItem href="/dashboard" icon={<LayoutDashboard size={18}/>}>
            Dashboard
          </NavItem>

          <NavItem href="/dashboard/products" icon={<Package size={18}/>}>
            Produtos
          </NavItem>

          <NavItem href="/dashboard/orders" icon={<ShoppingCart size={18}/>}>
            Pedidos
          </NavItem>

          <NavItem href="/dashboard/categories" icon={<Layers size={18}/>}>
            Categorias
          </NavItem>

        </nav>

      </aside>
    </>
  );
}

function NavItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="
      flex items-center gap-3 px-4 py-3 rounded-xl 
      hover:bg-white/5 transition
      text-sm
      "
    >
      {icon}
      {children}
    </Link>
  );
}