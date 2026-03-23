"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

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
    subtitle: "Peças criadas para performance e sofisticação em cada detalhe.",
    cta1: "/catalog",
    cta2: "/catalog",
  },
  {
    type: "promo" as SlideType,
    image: "/images/product-4.jpg",
    focus: "center 35%",
    title1: "Promoção da",
    title2: "semana",
    subtitle: "Condições exclusivas por tempo limitado. Não perca.",
    cta1: "#promocao",
    cta2: "/catalog",
  },
];

export default function HeroParallax() {
  const [index, setIndex] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const duration = 5200;

    function animate(timestamp: number) {
      if (paused) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      if (!startRef.current) startRef.current = timestamp;

      const elapsed = timestamp - startRef.current;
      const progressValue = elapsed / duration;

      if (progressValue >= 1) {
        setIndex((prev) => (prev + 1) % slides.length);
        setProgress(0);
        startRef.current = timestamp;
      } else {
        setProgress(progressValue);
      }

      frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [paused]);

  function handleMouseMove(e: React.MouseEvent) {
    const x = (e.clientX / window.innerWidth - 0.5) * 10;
    const y = (e.clientY / window.innerHeight - 0.5) * 10;
    setMouse({ x, y });
  }

  const slide = slides[index];

  return (
    <section
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative min-h-screen w-full overflow-hidden"
    >
      {/* BACKGROUND CINEMÁTICO */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.image}
          initial={{ opacity: 0, x: 80, scale: 1.06, filter: "blur(6px)" }}
          animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: -80, scale: 1.04, filter: "blur(4px)" }}
          transition={{
            duration: 1.2,
            ease: [0.22, 1, 0.36, 1], // 🔥 easing premium
          }}
          className="absolute inset-0"
        >
          <motion.div
            animate={{ x: mouse.x, y: mouse.y }}
            transition={{ duration: 8, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <Image
              src={slide.image}
              alt="Blackstore"
              fill
              priority
              sizes="(max-width:768px) 100vw, 100vw"
              className="object-cover"
              style={{
                objectPosition: slide.focus,
              }}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent md:bg-gradient-to-r md:from-black/80 md:via-black/40 md:to-black/10" />

      {/* CONTENT */}
      <div className="relative z-10 flex items-center min-h-screen">
        <div className="w-full max-w-7xl mx-auto px-5 md:px-10">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="
              w-full
              max-w-[280px] sm:max-w-sm md:max-w-lg lg:max-w-xl
              p-4 sm:p-6 md:p-8
              rounded-xl sm:rounded-2xl
              bg-black/30 sm:bg-black/25 md:bg-black/20
              backdrop-blur-md

              border border-white/10
              shadow-[0_10px_40px_rgba(0,0,0,0.35)]
            "
          >
            <p className="uppercase text-[10px] md:text-xs tracking-[0.4em] text-white/70">
              {slide.type === "promo"
                ? "Últimas unidades"
                : slide.type === "product"
                  ? "Alta performance"
                  : "Nova coleção"}
            </p>

            <h1 className="mt-4 text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-light leading-tight">
              <span className="block">{slide.title1}</span>
              <span className="block bs-title">{slide.title2}</span>
            </h1>

            <p className="mt-5 md:mt-6 text-white/90 text-sm md:text-lg max-w-lg leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              {slide.subtitle}
            </p>

            <div className="mt-5 md:mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href={slide.cta1}
                className="px-6 md:px-8 py-3 rounded-full bg-[var(--gold)] text-black text-[10px] md:text-xs tracking-[0.35em] uppercase"
              >
                {slide.type === "promo"
                  ? "Aproveitar agora"
                  : "Quero essa coleção"}
              </Link>

              <Link
                href={slide.cta2}
                className="px-6 md:px-8 py-3 rounded-full border border-white/20 text-[10px] md:text-xs tracking-[0.35em] uppercase hover:bg-white/5"
              >
                Explorar catálogo
              </Link>
            </div>

            <div
              className="
                mt-6 md:mt-7
                flex flex-wrap gap-3 md:gap-4
                text-[10px] md:text-xs
                text-white/80
                tracking-widest uppercase
                drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
            >
              <span>✦ Frete rápido para todo Brasil</span>
              <span>✦ Peças exclusivas</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* BENEFÍCIOS */}
      <div className="absolute bottom-14 md:bottom-16 w-full z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-10">
          <div
            className="
        relative

        bg-white/[0.06] md:bg-white/[0.05]
        backdrop-blur-xl

        border border-white/10
        rounded-2xl

        grid grid-cols-2 md:grid-cols-4
        gap-4

        px-4 py-4 md:px-6 md:py-5

        text-center md:text-left

        shadow-[0_20px_60px_rgba(0,0,0,0.45)]
      "
          >
            {/* DIVISÓRIAS DESKTOP */}
            <div className="hidden md:block absolute inset-y-4 left-1/4 w-px bg-white/10" />
            <div className="hidden md:block absolute inset-y-4 left-2/4 w-px bg-white/10" />
            <div className="hidden md:block absolute inset-y-4 left-3/4 w-px bg-white/10" />

            {/* ITEM 1 */}
            <div className="flex flex-col items-center md:items-start gap-1">
              <p
                className="
          text-[12px] md:text-sm
          font-semibold
          text-white
          tracking-wide
        "
              >
                Compra segura
              </p>

              <p
                className="
          text-[11px]
          text-white/70
          leading-tight
        "
              >
                dados protegidos
              </p>
            </div>

            {/* ITEM 2 */}
            <div className="flex flex-col items-center md:items-start gap-1">
              <p
                className="
          text-[12px] md:text-sm
          font-semibold
          text-white
          tracking-wide
        "
              >
                Parcele em até 3x
              </p>

              <p
                className="
          text-[11px]
          text-white/70
          leading-tight
        "
              >
                no cartão
              </p>
            </div>

            {/* ITEM 3 */}
            <div className="flex flex-col items-center md:items-start gap-1">
              <p
                className="
          text-[12px] md:text-sm
          font-semibold
          text-white
          tracking-wide
        "
              >
                Entrega rápida
              </p>

              <p
                className="
          text-[11px]
          text-white/70
          leading-tight
        "
              >
                todo Brasil
              </p>
            </div>

            {/* ITEM 4 */}
            <div className="flex flex-col items-center md:items-start gap-1">
              <p
                className="
          text-[12px] md:text-sm
          font-semibold
          text-white
          tracking-wide
        "
              >
                Qualidade garantida
              </p>

              <p
                className="
          text-[11px]
          text-white/70
          leading-tight
        "
              >
                produtos premium
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="absolute bottom-10 left-0 w-full px-6 md:px-10">
        <div className="h-[2px] bg-white/10 w-full overflow-hidden">
          <motion.div
            className="h-full bg-[var(--gold)]"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* INDICADORES */}
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
