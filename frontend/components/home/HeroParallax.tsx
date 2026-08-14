"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Tag, Check } from "lucide-react";

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
    focus: "center 20%",
    focusDesktop: "center 10%", // 🔥 Ancorado no topo para nunca cortar a cabeça da modelo no notebook
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
    focusDesktop: "center 10%", // 🔥 Ancorado no topo para nunca cortar a cabeça da modelo no notebook
    title1: "Elegância em",
    title2: "movimento",
    subtitle: "Peças criadas para performance e sofisticação em cada detalhe.",
    cta1: "/catalog",
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

  const objectPosition = useMemo(() => {
    if (!slide) return "center";
    return isDesktop ? "center 10%" : slide.focus;
  }, [isDesktop, slide]);

  if (!slide) return null;

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative w-full h-[88vh] md:h-[92vh] overflow-hidden bg-black"
    >
      {/* BACKGROUND DA HERO */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.image}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 w-full h-full overflow-hidden bg-black"
        >
          <Image
            src={slide.image}
            alt="Blackstore"
            fill
            priority
            quality={100}
            sizes="100vw"
            className="w-full h-full object-cover object-center"
            style={{
              objectPosition,
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* OVERLAY DE LEITURA (GRADIENTE LUXO) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 md:bg-gradient-to-r md:from-black/85 md:via-black/50 md:to-transparent pointer-events-none" />

      {/* 🔥 CUPOM: Visível APENAS em telas médias/grandes (md:flex), totalmente oculto no celular para não cobrir o rosto */}
      <div className="hidden md:flex absolute top-28 right-12 z-30">
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="
            relative
            bg-black/80 backdrop-blur-2xl
            border border-[var(--gold)]/40
            rounded-2xl px-5 py-3.5
            shadow-[0_10px_30px_rgba(0,0,0,0.8)]
            flex items-center gap-3
          "
        >
          <div className="w-8 h-8 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center text-[var(--gold)] shrink-0">
            <Tag size={14} />
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-[9px] uppercase tracking-widest text-white/50">
              Desconto VIP
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-bold text-[var(--gold)] tracking-wider">
                10% OFF
              </span>
              <span className="text-[9px] text-white/30">•</span>
              <span className="text-xs font-mono text-white/90">
                BLACK10
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText("BLACK10");
              setCouponCopied(true);
              localStorage.setItem("applied_coupon", "BLACK10");
              setTimeout(() => setCouponCopied(false), 2000);
            }}
            className={`
              ml-2 px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-widest font-semibold transition-all duration-300 shadow-md
              ${
                couponCopied
                  ? "bg-emerald-500 text-black font-bold"
                  : "bg-white/10 text-white hover:bg-[var(--gold)] hover:text-black"
              }
            `}
          >
            {couponCopied ? <Check size={12} /> : "Copiar"}
          </button>
        </motion.div>
      </div>

      {/* CONTEÚDO DA HERO */}
      <div className="relative z-10 flex items-center h-full pt-10">
        <div className="w-full max-w-7xl mx-auto px-5 md:px-10">
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
            className="w-full max-w-full sm:max-w-sm md:max-w-lg lg:max-w-xl"
          >
            {/* LABEL */}
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.6 }}
              className="uppercase text-[10px] tracking-[0.4em] text-white/70 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
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
              transition={{ duration: 0.8 }}
              className="mt-3 text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-light leading-tight"
            >
              <span className="block text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
                {slide.title1}
              </span>
              <span className="block bg-gradient-to-r from-[var(--gold)] via-[#f5d07a] to-white bg-clip-text text-transparent drop-shadow-[0_6px_25px_rgba(212,175,55,0.35)]">
                {slide.title2}
              </span>
            </motion.h1>

            {/* SUBTITLE */}
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.7 }}
              className="mt-4 text-white/80 md:text-white/65 text-xs sm:text-sm md:text-base max-w-lg leading-relaxed drop-shadow-[0_3px_14px_rgba(0,0,0,0.70)] md:drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]"
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
              className="mt-6 flex flex-col sm:flex-row gap-3.5"
            >
              <Link
                href={slide.cta1}
                className="px-6 py-3.5 rounded-full bg-[var(--gold)] text-black text-[10px] tracking-[0.3em] uppercase font-semibold text-center hover:scale-[1.02] active:scale-95 transition shadow-xl"
              >
                {slide.type === "promo" ? "Aproveitar agora" : "Quero essa coleção"}
              </Link>
              <Link
                href={slide.cta2}
                className="px-6 py-3.5 rounded-full border border-white/20 text-[10px] tracking-[0.3em] uppercase text-center hover:bg-white/10 hover:border-white/50 transition"
              >
                Explorar catálogo
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* BENEFÍCIOS BAR */}
      <div className="absolute bottom-16 w-full z-20 px-4 md:px-0">
        <div className="max-w-7xl mx-auto px-0 md:px-10">
          <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl grid grid-cols-3 gap-2 px-3 py-3 md:px-5 md:py-4 text-center md:text-left shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col items-center md:items-start leading-tight">
              <p className="text-[11px] md:text-sm font-medium text-white">Compra segura</p>
              <p className="text-[9px] md:text-xs text-white/50">dados protegidos</p>
            </div>
            <div className="flex flex-col items-center md:items-start leading-tight">
              <p className="text-[11px] md:text-sm font-medium text-white">Parcele em até 3x</p>
              <p className="text-[9px] md:text-xs text-white/50">sem juros</p>
            </div>
            <div className="flex flex-col items-center md:items-start leading-tight">
              <p className="text-[11px] md:text-sm font-medium text-white">Qualidade premium</p>
              <p className="text-[9px] md:text-xs text-white/50">alta durabilidade</p>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE PROGRESSO DO SLIDE */}
      <div className="absolute bottom-8 left-0 w-full px-6 md:px-10">
        <div className="h-[2px] bg-white/10 w-full rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[var(--gold)]"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* INDICADORES (DOTS) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
        {slidesState.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)} aria-label={`Slide ${i + 1}`}>
            <span
              className={`block h-[2px] transition-all duration-300 ${
                i === index ? "bg-[var(--gold)] w-10" : "bg-white/30 w-6"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}