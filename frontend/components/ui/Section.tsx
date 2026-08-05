import { ReactNode } from "react";

type SectionProps = {
  id?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
};

export default function Section({
  id,
  title,
  subtitle,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      className="
        relative
        py-16 sm:py-20 md:py-24 lg:py-28
      "
    >
      {/* 
        🔥 CORREÇÃO: O "BACKGROUND SYSTEM" isolado foi removido daqui. 
        Agora esta seção é 100% transparente e deixa o radial-gradient
        do globals.css fluir perfeitamente de cima a baixo, sem listras/cortes.
      */}

      <div
        className="
          max-w-[1400px]
          mx-auto
          px-4 sm:px-6 md:px-8 lg:px-10
        "
      >
        {/* HEADER PREMIUM */}
        <div className="mb-12 md:mb-14 lg:mb-16">
          {/* label linha */}
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-10 bg-[var(--gold)]/60" />
            <p className="text-[10px] tracking-[0.45em] uppercase text-white/40">
              Blackstore
            </p>
          </div>

          {/* título */}
          <h2
            className="
              text-2xl sm:text-3xl md:text-4xl lg:text-5xl
              font-light
              tracking-wide
              leading-tight
            "
          >
            {title}
          </h2>

          {/* subtitle */}
          {subtitle && (
            <p
              className="
                mt-5
                text-white/60
                text-sm sm:text-base
                max-w-md sm:max-w-lg md:max-w-xl
                leading-relaxed
              "
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* CONTENT */}
        <div className="relative">
          {children}
        </div>
      </div>
    </section>
  );
}