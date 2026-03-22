"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

type SlideType = "collection" | "product" | "promo";

const slides = [
  {
    type: "collection" as SlideType,
    image: "/images/hero.jpg",
    focus: "center 25%", // ajuste fino aqui
    title1: "Moda que",
    title2: "impõe presença",
    subtitle:
      "Performance, estética e atitude. A nova coleção redefine o conceito premium.",
    cta1: "#lancamentos",
    cta2: "/catalog",
  },
  {
    type: "product" as SlideType,
    image: "/images/product-3.jpg",
    focus: "center 20%",
    title1: "Elegância em",
    title2: "movimento",
    subtitle:
      "Peças criadas para performance e sofisticação em cada detalhe.",
    cta1: "/catalog",
    cta2: "/catalog",
  },
  {
    type: "promo" as SlideType,
    image: "/images/product-4.jpg",
    focus: "center 35%",
    title1: "Promoção da",
    title2: "semana",
    subtitle:
      "Condições exclusivas por tempo limitado. Não perca.",
    cta1: "#promocao",
    cta2: "/catalog",
  },
];

export default function HeroParallax() {
  const [index, setIndex] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5200);

    return () => clearInterval(interval);
  }, []);

  function handleMouseMove(e: React.MouseEvent) {
    const x = (e.clientX / window.innerWidth - 0.5) * 25;
    const y = (e.clientY / window.innerHeight - 0.5) * 25;
    setMouse({ x, y });
  }

  const slide = slides[index];

  return (
    <section
      onMouseMove={handleMouseMove}
      className="
        relative 
        h-[70vh] sm:h-[80vh] md:h-[92vh] 
        w-full overflow-hidden
      "
    >
      {/* BACKGROUND PRINCIPAL */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.image}
          initial={{ opacity: 0, scale: 1.15, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1.02, filter: "blur(0px)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.3 }}
          className="absolute inset-0"
        >
          <motion.div
            animate={{
              x: mouse.x,
              y: mouse.y,
              scale: [1.02, 1.06, 1.02],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0"
          >
            <Image
              src={slide.image}
              alt="Blackstore"
              fill
              priority
              style={{
                objectFit: "cover",
                objectPosition:
                  slide.type === "product"
                  ? "center 20%"
                  :slide.type === "collection"
                  ?"center 30%"
                  : "center",
              }}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* CAMADA DE PROFUNDIDADE */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(228,163,181,0.12),transparent_60%)]" />

      {/* GLOW PRINCIPAL */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(212,175,55,0.30),transparent_60%)]" />

      {/* OVERLAY CINEMATOGRÁFICO */}
      <div
        className={`absolute inset-0 ${
          slide.type === "promo"
            ? "bg-gradient-to-r from-black/95 via-black/50 to-black/20"
            : "bg-gradient-to-r from-black/95 via-black/50 to-black/20"
        }`}
      />

      {/* CONTENT */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-8xl mx-auto px-5 md:px-8 w-full">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 90 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="
        max-w-xl md:max-w-2xl
        p-6 md:p-10
        rounded-2xl
        bs-glass
        backdrop-blur-xl
        border border-white/10
        shadow-[0_0_60px_rgba(0,0,0,0.6)]
      "
          >
            <p className="uppercase text-[10px] md:text-xs tracking-[0.4em] text-white/60">
              {slide.type === "promo"
                ? "Últimas unidades"
                : slide.type === "product"
                  ? "Alta performance"
                  : "Nova coleção"}
            </p>

            <h1 className="mt-4 text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-light leading-tight">
              <span className="block">{slide.title1}</span>
              <span className="block bs-title">{slide.title2}</span>
            </h1>

            <p className="mt-5 text-white/70 text-sm md:text-lg max-w-lg">
              {slide.subtitle}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <motion.div
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
              >
                <Link
                  href={slide.cta1}
                  className="
              px-8 py-3 rounded-full 
              bg-[var(--gold)] text-black 
              text-[10px] md:text-xs tracking-[0.35em] uppercase 
              transition-all duration-300
            "
                >
                  {slide.type === "promo"
                    ? "Aproveitar agora"
                    : "Quero essa coleção"}
                </Link>
              </motion.div>

              <Link
                href={slide.cta2}
                className="
            px-8 py-3 rounded-full 
            border border-white/20 
            text-[10px] md:text-xs tracking-[0.35em] uppercase 
            hover:bg-white/5 hover:border-white/40
            transition-all duration-300
          "
              >
                Explorar catálogo
              </Link>
            </div>

            {/* PROVA + URGÊNCIA */}
            <div className="mt-6 flex flex-wrap gap-4 text-[10px] md:text-xs text-white/60 tracking-widest uppercase">
              <span className="flex items-center gap-2">
                ✦ Frete rápido para todo Brasil
              </span>
              <span className="flex items-center gap-2">
                ✦ Peças exclusivas e limitadas
              </span>
              <span className="flex items-center gap-2 text-[var(--gold)]">
                ✦ 
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* INDICADORES PREMIUM */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className="group flex items-center justify-center"
          >
            <span
              className={`
                h-[2px] w-8 
                transition-all duration-300
                ${
                  i === index
                    ? "bg-[var(--gold)] w-12"
                    : "bg-white/30 group-hover:bg-white/60"
                }
              `}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
