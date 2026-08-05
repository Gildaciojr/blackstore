"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type SlideType = "collection" | "product" | "promo";

type Slide = {
  type: SlideType;
  image: string;
  focus: string;
  focusDesktop: string;
  title1: string;
  title2: string;
  subtitle: string;
  cta1: string;
  cta2: string;
};

const fallbackSlides: Slide[] = [
  {
    type: "collection",
    image: "/images/hero.jpg",
    focus: "center 25%",
    focusDesktop: "center 22%",
    title1: "Moda que",
    title2: "impõe presença",
    subtitle:
      "Performance, estética e atitude. A nova coleção redefine o conceito premium.",
    cta1: "#lancamentos",
    cta2: "/catalog",
  },
  {
    type: "product",
    image: "/images/product-3.jpg",
    focus: "center 20%",
    focusDesktop: "center 16%",
    title1: "Elegância em",
    title2: "movimento",
    subtitle: "Peças criadas para performance e sofisticação em cada detalhe.",
    cta1: "/catalog",
    cta2: "/catalog",
  },
  {
    type: "promo",
    image: "/images/product-4.jpg",
    focus: "center 35%",
    focusDesktop: "center 28%",
    title1: "Promoção da",
    title2: "semana",
    subtitle: "Condições exclusivas por tempo limitado. Não perca.",
    cta1: "#promocao",
    cta2: "/catalog",
  },
];

type HeroParallaxProps = {
  slides?: Slide[];
};

export default function HeroParallax({
  slides: externalSlides,
}: HeroParallaxProps) {
  const [index, setIndex] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [couponCopied, setCouponCopied] = useState(false);

  const startRef = useRef<number | null>(null);
  const progressRef = useRef(0);

  const slidesState = useMemo(() => {
    if (externalSlides && externalSlides.length > 0) {
      return externalSlides;
    }
    return fallbackSlides;
  }, [externalSlides]);

  const safeIndex =
    slidesState.length > 0
      ? ((index % slidesState.length) + slidesState.length) % slidesState.length
      : 0;

  const slide = slidesState[safeIndex];

  useEffect(() => {
    function syncBreakpoint() {
      setIsDesktop(window.innerWidth >= 768);
    }
    syncBreakpoint();
    window.addEventListener("resize", syncBreakpoint);
    return () => {
      window.removeEventListener("resize", syncBreakpoint);
    };
  }, []);

  useEffect(() => {
    if (slidesState.length === 0) return;

    const duration = 5200;
    let raf = 0;

    function loop(timestamp: number) {
      if (!startRef.current) {
        startRef.current = timestamp;
      }

      if (paused) {
        startRef.current = timestamp - progressRef.current * duration;
      }

      const elapsed = timestamp - startRef.current;
      const progressValue = Math.min(elapsed / duration, 1);

      progressRef.current = progressValue;

      if (progressValue >= 1) {
        setIndex((prev) =>
          slidesState.length > 0 ? (prev + 1) % slidesState.length : 0,
        );
        startRef.current = timestamp;
        progressRef.current = 0;
        setProgress(0);
      } else {
        setProgress(progressValue);
      }

      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused, slidesState.length]);

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDesktop) return;
    
    // 🔥 LIMITADOR SUAVE DO PARALLAX PARA EVITAR QUALQUER CORTE NAS BORDAS
    const MAX_OFFSET = 10; 
    
    const x = (e.clientX / window.innerWidth - 0.5) * MAX_OFFSET;
    const y = (e.clientY / window.innerHeight - 0.5) * MAX_OFFSET;
    setMouse({ x, y });
  }

  const objectPosition = useMemo(() => {
    if (!slide) return "center";
    return isDesktop ? slide.focusDesktop : slide.focus;
  }, [isDesktop, slide]);

  if (!slide) return null;

  return (
    <section
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative w-full h-[85vh] md:h-[95vh] overflow-hidden bg-black" 
    >
      {/* BACKGROUND */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.image}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1 }}
          className="absolute inset-0"
        >
          {/* 🔥 CORREÇÃO DE ZOOM/ESTOURO: Removido o inset agressivo e ajustado o translate para fluir dentro da proporção ideal */}
          <motion.div
            animate={{ x: mouse.x, y: mouse.y }}
            transition={{
              duration: 2,
              ease: "easeOut",
            }}
            className="absolute inset-[-15px] transform-gpu"
          >
            <div className="relative w-full h-full">
              <Image
                src={slide.image}
                alt="Blackstore"
                fill
                priority
                quality={100} // 🔥 ALTA DEFINIÇÃO PARA MONITORES RETINA E IPHONES PRO MAX
                sizes="100vw"
                className="object-cover md:object-cover will-change-transform"
                style={{ objectPosition }}
              />
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent md:bg-gradient-to-r md:from-black/80 md:via-black/40 md:to-transparent" />

      {/* CONTENT */}
      <div className="relative z-10 flex items-center h-full">
        <div className="w-full max-w-7xl mx-auto px-0 md:px-10">
          <motion.div
            key={index}
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.12,
                  delayChildren: 0.2,
                },
              },
            }}
            className="
              w-full
              max-w-full sm:max-w-sm md:max-w-lg lg:max-w-xl px-5 sm:px-0
            "
          >
            {/* LABEL */}
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="
                uppercase text-[10px]
                tracking-[0.4em]
                text-white/70
                drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]
              "
            >
              {slide.type === "promo"
                ? "Últimas unidades"
                : slide.type === "product"
                  ? "Alta performance"
                  : "Nova coleção"}
            </motion.p>

            {/* TITLE */}
            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 40 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-light leading-tight"
            >
              <span className="block text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
                {slide.title1}
              </span>

              <span
                className="
                  block
                  bg-gradient-to-r from-[var(--gold)] via-[#f5d07a] to-white
                  bg-clip-text text-transparent
                  drop-shadow-[0_6px_25px_rgba(212,175,55,0.35)]
                "
              >
                {slide.title2}
              </span>
            </motion.h1>

            {/* SUBTITLE */}
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="
                mt-5
                text-white/90
                text-sm md:text-lg
                max-w-lg
                leading-relaxed
                drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)]
              "
            >
              {slide.subtitle}
            </motion.p>

            {/* BUTTONS */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.7 }}
              className="mt-6 flex flex-col sm:flex-row gap-4"
            >
              <Link
                href={slide.cta1}
                className="
                  px-6 py-3
                  rounded-full
                  bg-[var(--gold)]
                  text-black
                  text-xs
                  tracking-[0.3em]
                  uppercase
                  font-semibold
                  text-center
                  hover:scale-105
                  active:scale-95
                  transition
                  shadow-[0_0_20px_rgba(212,175,55,0.3)]
                "
              >
                {slide.type === "promo"
                  ? "Aproveitar agora"
                  : "Quero essa coleção"}
              </Link>

              <Link
                href={slide.cta2}
                className="
                  px-6 py-3
                  rounded-full
                  border border-white/20
                  text-xs
                  tracking-[0.3em]
                  uppercase
                  text-center
                  hover:bg-white/10
                  hover:border-white/50
                  transition
                "
              >
                Explorar catálogo
              </Link>
            </motion.div>

            {/* INFO */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.6 }}
              className="
                mt-6
                flex flex-wrap gap-3
                text-[10px]
                text-white/80
                uppercase
                tracking-widest
                drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]
              "
            >
              <span>✦ Frete rápido para todo Brasil</span>
              <span>✦ Peças exclusivas</span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* BENEFÍCIOS */}
      <div className="absolute bottom-16 w-full z-20 px-3 md:px-0">
        <div className="max-w-7xl mx-auto px-4 md:px-10">
          <div
            className="
              bg-black/30
              backdrop-blur-md
              border border-white/10
              rounded-lg md:rounded-xl
              grid grid-cols-3 md:grid-cols-3
              gap-2 md:gap-3
              px-3 py-2.5 md:px-5 md:py-3.5
              text-center md:text-left
              shadow-[0_10px_30px_rgba(0,0,0,0.35)]
            "
          >
            <div className="flex flex-col items-center md:items-start leading-tight">
              <p className="text-[11px] md:text-sm font-medium text-white">
                Compra segura
              </p>
              <p className="text-[9px] md:text-xs text-white/70">
                dados protegidos
              </p>
            </div>

            <div className="flex flex-col items-center md:items-start leading-tight">
              <p className="text-[11px] md:text-sm font-medium text-white">
                Parcele em até 3x
              </p>
              <p className="text-[9px] md:text-xs text-white/70">sem juros</p>
            </div>

            <div className="flex flex-col items-center md:items-start leading-tight">
              <p className="text-[11px] md:text-sm font-medium text-white">
                Qualidade garantida
              </p>
              <p className="text-[9px] md:text-xs text-white/70">
                produtos premium
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="absolute bottom-10 left-0 w-full px-6 md:px-10">
        <div className="h-[2px] bg-white/10 w-full rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[var(--gold)]"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* INDICADORES */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        {slidesState.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)}>
            <span
              className={`block h-[2px] w-8 transition-all duration-300 ${
                i === index ? "bg-[var(--gold)] w-12" : "bg-white/30"
              }`}
            />
          </button>
        ))}
      </div>

      {/* 🔥 CUPOM COMPACTO E RESPONSIVO (Não polui a tela do celular nem cobre rostos) */}
      <div className="absolute top-20 right-3 md:top-6 md:right-10 z-30">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="
            relative
            bg-black/70 backdrop-blur-xl
            border border-[var(--gold)]/30
            rounded-xl px-3 py-2 md:px-4 md:py-3
            shadow-[0_10px_30px_rgba(0,0,0,0.6)]
            flex items-center gap-2.5
            max-w-[210px] md:max-w-none
          "
        >
          <div className="leading-tight">
            <span className="text-[7px] md:text-[9px] uppercase tracking-widest text-white/40 block">
              Ganhe agora
            </span>
            <div className="text-[10px] md:text-xs font-semibold text-[var(--gold)]">
              10% OFF <span className="text-white/60 font-mono text-[9px]">BLACK10</span>
            </div>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText("BLACK10");
              setCouponCopied(true);
              localStorage.setItem("applied_coupon", "BLACK10");

              setTimeout(() => {
                setCouponCopied(false);
              }, 2000);
            }}
            className={`
              text-[8px] md:text-[10px]
              uppercase tracking-widest
              px-2.5 py-1 md:px-3 md:py-1.5
              rounded-lg
              font-medium
              transition-all duration-300
              ${
                couponCopied
                  ? "bg-emerald-500 text-black"
                  : "bg-white/10 text-white hover:bg-[var(--gold)] hover:text-black"
              }
            `}
          >
            {couponCopied ? "Copiado!" : "Copiar"}
          </button>
        </motion.div>
      </div>
    </section>
  );
}