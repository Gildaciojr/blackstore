"use client";

import { usePathname } from "next/navigation";
import "./globals.css";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

import GlowCursor from "@/components/ui/GlowCursor";
import CartLoader from "@/components/cart/CartLoader";
import AuthLoader from "@/components/auth/AuthLoader";

import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // 🔥 CORREÇÃO 1: Remove o padding superior (pt-24) APENAS na Home.
  // Isso faz com que a Hero imagem comece colada no topo (atrás do header transparente).
  const isHome = pathname === "/";

  return (
    <html lang="pt-BR" className="scroll-smooth">
      <head>
        <title>Blackstore — Moda Fitness Premium</title>
        <meta name="description" content="Moda fitness e vestidos com estética premium para mulheres que valorizam presença e autenticidade." />
      </head>
      <body className="text-white antialiased selection:bg-[var(--gold)] selection:text-black min-h-screen flex flex-col">
        {/* ✅ SCRIPT OFICIAL PAGBANK (SDK v4) */}
        <Script
          src="https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js"
          strategy="afterInteractive"
        />

        <AuthLoader />
        <CartLoader />

        <GlowCursor />
        <Header />

        {/* 🔥 CORREÇÃO: Aplica o padding flexivelmente */}
        <main className={`flex-1 flex flex-col ${isHome ? "pt-0" : "pt-24 md:pt-28"}`}>
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}