import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/10 bg-black overflow-hidden">
      {/* GLOW REFINADO */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(circle,rgba(212,175,55,0.06),transparent_70%)] blur-3xl opacity-60" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-14 md:py-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12">
          
          {/* MARCA E DESCRIÇÃO */}
          <div className="max-w-sm">
            <Link href="/" className="inline-block focus:outline-none" aria-label="Blackstore Home">
              <Image
                src="/images/logo-v2.png"
                alt="Blackstore"
                width={130}
                height={50}
                className="object-contain mb-5"
              />
            </Link>

            <p className="text-sm text-white/60 leading-relaxed">
              Moda fitness e vestidos premium para mulheres que valorizam presença e autenticidade.
            </p>
          </div>

          {/* COLUNAS DE LINKS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 sm:gap-14 text-xs">
            
            {/* INSTITUCIONAL */}
            <div>
              <p className="text-white/80 mb-4 tracking-[0.35em] uppercase text-[10px] font-semibold">
                Institucional
              </p>
              <ul className="space-y-3 text-white/60">
                <li>
                  <Link href="#" className="group inline-block relative py-0.5">
                    <span className="group-hover:text-[var(--gold)] transition-colors">
                      Sobre
                    </span>
                    <span className="absolute left-0 -bottom-0.5 w-0 h-[1px] bg-[var(--gold)] transition-all duration-300 group-hover:w-full" />
                  </Link>
                </li>
                <li>
                  <Link href="#" className="group inline-block relative py-0.5">
                    <span className="group-hover:text-[var(--gold)] transition-colors">
                      Trocas
                    </span>
                    <span className="absolute left-0 -bottom-0.5 w-0 h-[1px] bg-[var(--gold)] transition-all duration-300 group-hover:w-full" />
                  </Link>
                </li>
                <li>
                  <Link href="#" className="group inline-block relative py-0.5">
                    <span className="group-hover:text-[var(--gold)] transition-colors">
                      Privacidade
                    </span>
                    <span className="absolute left-0 -bottom-0.5 w-0 h-[1px] bg-[var(--gold)] transition-all duration-300 group-hover:w-full" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* ATENDIMENTO */}
            <div>
              <p className="text-white/80 mb-4 tracking-[0.35em] uppercase text-[10px] font-semibold">
                Atendimento
              </p>
              <ul className="space-y-3 text-white/60">
                <li>
                  <a
                    href="mailto:contato@blackstore.com"
                    className="group inline-block relative py-0.5"
                  >
                    <span className="group-hover:text-[var(--gold)] transition-colors">
                      contato@blackstore.com
                    </span>
                    <span className="absolute left-0 -bottom-0.5 w-0 h-[1px] bg-[var(--gold)] transition-all duration-300 group-hover:w-full" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/5562994694804"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Fale conosco via WhatsApp"
                    className="group inline-block relative py-0.5"
                  >
                    <span className="group-hover:text-[var(--gold)] transition-colors">
                      (62) 99469-4804
                    </span>
                    <span className="absolute left-0 -bottom-0.5 w-0 h-[1px] bg-[var(--gold)] transition-all duration-300 group-hover:w-full" />
                  </a>
                </li>
              </ul>
            </div>

            {/* SOCIAL */}
            <div>
              <p className="text-white/80 mb-4 tracking-[0.35em] uppercase text-[10px] font-semibold">
                Social
              </p>
              <ul className="space-y-3 text-white/60">
                <li>
                  <a
                    href="https://instagram.com/blackstoreloja1"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Siga-nos no Instagram"
                    className="group inline-block relative py-0.5"
                  >
                    <span className="group-hover:text-[var(--gold)] transition-colors">
                      Instagram
                    </span>
                    <span className="absolute left-0 -bottom-0.5 w-0 h-[1px] bg-[var(--gold)] transition-all duration-300 group-hover:w-full" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/5562994694804"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Atendimento no WhatsApp"
                    className="group inline-block relative py-0.5"
                  >
                    <span className="group-hover:text-[var(--gold)] transition-colors">
                      WhatsApp
                    </span>
                    <span className="absolute left-0 -bottom-0.5 w-0 h-[1px] bg-[var(--gold)] transition-all duration-300 group-hover:w-full" />
                  </a>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* LINHA PREMIUM DE FECHAMENTO */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--gold)]/30 to-transparent opacity-70" />

      {/* BASE / COPYRIGHT */}
      <div className="text-center text-[11px] text-white/40 py-6 tracking-wide">
        © {currentYear} Blackstore — Todos os direitos reservados
      </div>
    </footer>
  );
}