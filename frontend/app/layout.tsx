import type { Metadata, Viewport } from "next";
import "./globals.css";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

import GlowCursor from "@/components/ui/GlowCursor";
import CartLoader from "@/components/cart/CartLoader";
import AuthLoader from "@/components/auth/AuthLoader";

import Script from "next/script";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Blackstore — Moda Fitness Premium",
  description: "Moda fitness e vestidos com estética premium para mulheres que valorizam presença e autenticidade.",
  keywords: ["moda fitness", "vestidos", "fitness premium", "roupas femininas", "blackstore"],
  authors: [{ name: "Gildácio Júnior" }],
  openGraph: {
    title: "Blackstore — Moda Fitness Premium",
    description: "Moda fitness e vestidos com estética premium",
    url: "https://blackstore.cloud",
    siteName: "Blackstore",
    locale: "pt_BR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className="text-white antialiased selection:bg-[var(--gold)] selection:text-black">
        {/* ✅ SCRIPT OFICIAL PAGBANK (SDK v4) */}
        <Script
          src="https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js"
          strategy="afterInteractive"
        />

        <AuthLoader />
        <CartLoader />

        <GlowCursor />
        <Header />

        {/* Main com espaçamento adequado considerando o Header fixo */}
        <main className="min-h-screen flex flex-col pt-24 md:pt-28">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}