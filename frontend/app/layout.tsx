import type { Metadata } from "next";
import "./globals.css";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

import GlowCursor from "@/components/ui/GlowCursor";
import CartLoader from "@/components/cart/CartLoader";
import AuthLoader from "@/components/auth/AuthLoader";

import Script from "next/script";

export const metadata: Metadata = {
  title: "Blackstore — Moda Fitness Premium",
  description: "Moda fitness e vestidos com estética premium",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-black text-white antialiased">
        {/* ✅ SCRIPT PAGBANK (FORMA CORRETA) */}
        <Script
          src="https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js"
          strategy="afterInteractive"
        />

        <AuthLoader />
        <CartLoader />

        <GlowCursor />
        <Header />

        <main className="pt-20">{children}</main>

        <Footer />
      </body>
    </html>
  );
}
