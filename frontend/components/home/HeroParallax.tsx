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
    focus: "center 25%",
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
    const x = (e.clientX / window.innerWidth - 0.5) * 15;
    const y = (e.clientY / window.innerHeight - 0.5) * 15;
    setMouse({ x, y });
  }

  const slide = slides[index];

  return (
    <section
      onMouseMove={handleMouseMove}
      className="
        relative
        min-h-screen
        w-full
        overflow-hidden
      "
    >

      {/* BACKGROUND */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.image}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <motion.div
            animate={{
              x: mouse.x,
              y: mouse.y,
            }}
            transition={{
              duration: 10,
              ease: "easeOut",
            }}
            className="absolute inset-0"
          >
            <Image
              src={slide.image}
              alt="Blackstore"
              fill
              priority
              sizes="100vw"
              style={{
                objectFit: "cover",
                objectPosition:
                  slide.type === "product"
                    ? "center 20%"
                    : slide.type === "collection"
                    ? "center 30%"
                    : "center",
              }}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* OVERLAY AJUSTADO (MENOS AGRESSIVO MOBILE) */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent md:from-black/90 md:via-black/50 md:to-black/20" />

      {/* CONTENT */}
      <div className="relative z-10 flex items-center min-h-screen">

        <div className="w-full max-w-7xl mx-auto px-5 md:px-10">

          <motion.div
            key={index}
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="
              w-full
              max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl
              p-4 sm:p-6 md:p-08
              rounded-2xl
              bs-glass
              backdrop-blur-md
              border border-white/10
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

              <Link
                href={slide.cta1}
                className="
                  px-8 py-3 rounded-full 
                  bg-[var(--gold)] text-black 
                  text-[10px] md:text-xs tracking-[0.35em] uppercase 
                "
              >
                {slide.type === "promo"
                  ? "Aproveitar agora"
                  : "Quero essa coleção"}
              </Link>

              <Link
                href={slide.cta2}
                className="
                  px-8 py-3 rounded-full 
                  border border-white/20 
                  text-[10px] md:text-xs tracking-[0.35em] uppercase 
                  hover:bg-white/5
                "
              >
                Explorar catálogo
              </Link>

            </div>

            {/* INFO */}
            <div className="mt-6 flex flex-wrap gap-4 text-[10px] md:text-xs text-white/60 tracking-widest uppercase">
              <span>✦ Frete rápido para todo Brasil</span>
              <span>✦ Peças exclusivas</span>
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
