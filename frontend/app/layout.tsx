import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GlowCursor from "@/components/ui/GlowCursor";
import CartLoader from "@/components/cart/CartLoader";
import AuthLoader from "@/components/auth/AuthLoader";

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

        {/* loader do carrinho */}
        <CartLoader />
        <AuthLoader />

        <GlowCursor />
        <Header />

        <main className="pt-20">
          {children}
        </main>

        <Footer />

      </body>
    </html>
  );
}