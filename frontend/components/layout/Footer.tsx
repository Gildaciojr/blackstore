import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-black overflow-hidden">

      {/* glow sutil */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_0%,rgba(212,175,55,0.05),transparent_60%)]" />

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-10 md:py-12">

        {/* TOPO COMPACTO */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">

          {/* MARCA */}
          <div className="max-w-sm">
            <Image
              src="/images/logo.png"
              alt="Blackstore"
              width={120}
              height={50}
              className="object-contain mb-4"
            />

            <p className="text-xs text-white/60 leading-relaxed">
              Moda fitness e vestidos premium para mulheres que valorizam presença e autenticidade.
            </p>
          </div>

          {/* LINKS AGRUPADOS */}
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 text-xs">

            {/* INSTITUCIONAL */}
            <div>
              <p className="text-white/80 mb-3 tracking-[0.3em] uppercase text-[10px]">
                Institucional
              </p>

              <ul className="space-y-2 text-white/60">
                <li>
                  <Link href="#" className="hover:text-[var(--gold)] transition">
                    Sobre
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-[var(--gold)] transition">
                    Trocas
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-[var(--gold)] transition">
                    Privacidade
                  </Link>
                </li>
              </ul>
            </div>

            {/* CONTATO */}
            <div>
              <p className="text-white/80 mb-3 tracking-[0.3em] uppercase text-[10px]">
                Atendimento
              </p>

              <ul className="space-y-2 text-white/60">
                <li>
                  <a
                    href="mailto:contato@blackstore.com"
                    className="hover:text-[var(--gold)] transition"
                  >
                    contato@blackstore.com
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/5562994694804"
                    target="_blank"
                    className="hover:text-[var(--gold)] transition"
                  >
                    (62) 99469-4804
                  </a>
                </li>
              </ul>
            </div>

            {/* SOCIAL */}
            <div>
              <p className="text-white/80 mb-3 tracking-[0.3em] uppercase text-[10px]">
                Social
              </p>

              <ul className="space-y-2 text-white/60">
                <li>
                  <a
                    href="https://instagram.com/blackstoreloja1"
                    target="_blank"
                    className="hover:text-[var(--gold)] transition"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/5562994694804"
                    target="_blank"
                    className="hover:text-[var(--gold)] transition"
                  >
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>

          </div>

        </div>

      </div>

      {/* LINHA PREMIUM */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--gold)]/30 to-transparent" />

      {/* BASE */}
      <div className="text-center text-[11px] text-white/40 py-4 tracking-wide">
        © {new Date().getFullYear()} Blackstore — Todos os direitos reservados
      </div>

    </footer>
  );
}