"use client";

import { motion } from "framer-motion";
import ProductCard from "@/components/ui/ProductCard";
import { Trophy } from "lucide-react";

type Media = {
  id: string;
  type?: string;
  title?: string | null;
  url: string;
  productId?: string | null;
  createdAt?: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  oldPrice?: number | null;
  image: string;
  medias?: Media[];
  stock: number;
  categoryId: string;
  createdAt: string;
};

type WeeklyBestSellerItem = {
  id: string;
  position: number;
  productId: string;
  product: Product;
};

type Props = {
  items: WeeklyBestSellerItem[];
  onQuickView: (product: Product) => void;
  getCover: (product: Product) => string;
  getImages: (product: Product) => string[];
};

function rankLabel(position: number) {
  return String(position).padStart(2, "0");
}

export default function WeeklyBestSellers({
  items,
  onQuickView,
  getCover,
  getImages,
}: Props) {
  if (!items || items.length === 0) return null;

  const topOne = items[0];
  const others = items.slice(1, 4);

  return (
    <section className="relative pt-3 pb-12 md:pt-5 md:pb-16">
      
      {/* HEADER DA SEÇÃO */}
      <div className="mb-10 md:mb-12 border-b border-white/10 pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <Trophy size={14} className="text-[var(--gold)]" />
            <span className="text-[10px] md:text-xs uppercase tracking-[0.42em] text-[var(--gold)] font-medium">
              Destaques da Semana
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-light text-white tracking-wide">
            Ranking <span className="bs-title">Blackstore</span>
          </h2>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

        {/* TOP 1 - DESTAQUE MÁXIMO */}
        {topOne && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="group relative"
          >
            {/* Glow sofisticado */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.12),transparent_70%)]" />

            {/* Badge de Posição Top 1 */}
            <div className="absolute top-4 left-4 z-20 pointer-events-none">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-[var(--gold)] text-black text-sm font-bold shadow-[0_0_15px_rgba(212,175,55,0.6)]"
              >
                {rankLabel(1)}
              </motion.div>
            </div>

            {/* Container do Card */}
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl overflow-hidden border border-white/10 group-hover:border-[var(--gold)]/50 bg-neutral-950/40 backdrop-blur-sm transition-all duration-300 shadow-xl"
            >
              <ProductCard
                id={topOne.product.id}
                slug={topOne.product.slug}
                image={getCover(topOne.product)}
                images={getImages(topOne.product)}
                name={topOne.product.name}
                price={topOne.product.price}
                oldPrice={undefined}
                onQuickView={() => onQuickView(topOne.product)}
              />
            </motion.div>
          </motion.div>
        )}

        {/* OUTROS COLOCADOS (POSIÇÕES 2, 3 e 4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
          {others.map((item, index) => {
            const product = item.product;
            const position = index + 2;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                viewport={{ once: true }}
                className="group relative"
              >
                {/* Glow sutil */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.06),transparent_60%)]" />

                {/* Badge de Posição (2, 3, 4) */}
                <div className="absolute top-3 left-3 z-20 pointer-events-none">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-md"
                  >
                    {rankLabel(position)}
                  </motion.div>
                </div>

                {/* Container do Card */}
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl overflow-hidden border border-white/10 group-hover:border-white/30 bg-neutral-950/40 backdrop-blur-sm transition-all duration-300 shadow-lg"
                >
                  <ProductCard
                    id={product.id}
                    slug={product.slug}
                    image={getCover(product)}
                    images={getImages(product)}
                    name={product.name}
                    price={product.price}
                    oldPrice={undefined}
                    onQuickView={() => onQuickView(product)}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}