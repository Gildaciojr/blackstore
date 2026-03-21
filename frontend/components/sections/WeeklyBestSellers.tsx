"use client";

import { motion } from "framer-motion";
import ProductCard from "@/components/ui/ProductCard";

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
    <section className="relative">

      {/* HEADER */}
      <div className="mb-8 border-b border-white/10 pb-6">
        <p className="text-[10px] uppercase tracking-[0.42em] text-white/45 md:text-xs">
          Ranking Blackstore
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

        {/* TOP 1 */}
        {topOne && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            viewport={{ once: true }}
            className="group relative"
          >

            {/* glow sutil */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.15),transparent_60%)]" />

            {/* número */}
            <div className="absolute top-4 left-4 z-20">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--gold)] text-black text-sm font-semibold shadow-lg"
              >
                {rankLabel(1)}
              </motion.div>
            </div>

            {/* card */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="rounded-2xl overflow-hidden border border-white/10 group-hover:border-[var(--gold)]/40 transition-all duration-300"
            >
              <ProductCard
                id={topOne.product.id}
                slug={topOne.product.slug}
                image={getCover(topOne.product)}
                images={getImages(topOne.product)}
                name={topOne.product.name}
                price={topOne.product.price}
                oldPrice={topOne.product.oldPrice ?? undefined}
                badge="TOP 1"
                onQuickView={() => onQuickView(topOne.product)}
              />
            </motion.div>
          </motion.div>
        )}

        {/* OUTROS */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5">

          {others.map((item, index) => {
            const product = item.product;
            const position = index + 2;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="group relative"
              >

                {/* glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_60%)]" />

                {/* número */}
                <div className="absolute top-3 left-3 z-20">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black text-xs font-semibold shadow"
                  >
                    {rankLabel(position)}
                  </motion.div>
                </div>

                {/* card */}
                <motion.div
                  whileHover={{ y: -3 }}
                  className="rounded-2xl overflow-hidden border border-white/10 group-hover:border-white/30 transition-all duration-300"
                >
                  <ProductCard
                    id={product.id}
                    slug={product.slug}
                    image={getCover(product)}
                    images={getImages(product)}
                    name={product.name}
                    price={product.price}
                    oldPrice={product.oldPrice ?? undefined}
                    badge="BEST SELLER"
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