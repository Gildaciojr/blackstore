import Image from "next/image";
import Link from "next/link";
import { Mail, ArrowRight, ShieldCheck, CreditCard } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/10 overflow-hidden mt-20">
      {/* 🔥 "bg-black" removido da tag acima. Agora o fundo escuro do globals.css desce até o fim sem cortes. */}

      {/* GLOW REFINADO */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(circle,rgba(212,175,55,0.04),transparent_70%)] blur-3xl opacity-60" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-16 pb-8 relative z-10">
        {/* NEWSLETTER SECTION (E-commerce Premium) */}
        <div className="border-b border-white/10 pb-12 mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-md">
            <h3 className="text-xl font-light text-white mb-2">
              Blackstore Insider
            </h3>
            <p className="text-sm text-white/50 leading-relaxed">
              Receba lançamentos antecipados, dicas de estilo e benefícios
              exclusivos diretamente no seu e-mail.
            </p>
          </div>

          <form className="flex w-full md:w-auto items-center border border-white/20 rounded-full overflow-hidden focus-within:border-[var(--gold)] transition-colors bg-white/5">
            <div className="pl-5 pr-2 text-white/40">
              <Mail size={16} />
            </div>
            <input
              type="email"
              placeholder="Seu melhor e-mail"
              required
              className="bg-transparent text-sm w-full md:w-64 px-2 py-3.5 outline-none text-white placeholder:text-white/30"
            />
            <button
              type="submit"
              className="px-6 py-3.5 bg-white/5 hover:bg-[var(--gold)] hover:text-black transition-colors text-[10px] uppercase tracking-[0.25em] font-medium flex items-center gap-2"
            >
              Assinar <ArrowRight size={14} />
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* MARCA E DESCRIÇÃO */}
          <div className="lg:pr-8">
            <Link
              href="/"
              className="inline-block focus:outline-none"
              aria-label="Blackstore Home"
            >
              <Image
                src="/images/logo-v2.png"
                alt="Blackstore"
                width={140}
                height={55}
                className="object-contain mb-6"
              />
            </Link>

            <p className="text-sm text-white/60 leading-relaxed mb-6">
              Moda fitness e vestidos premium. Peças desenhadas para mulheres
              que valorizam presença, performance e autenticidade.
            </p>

            <div className="flex items-center gap-4 text-white/40">
              <span className="flex items-center gap-1.5 text-xs">
                <ShieldCheck size={16} className="text-[var(--gold)]" /> Compra
                Segura
              </span>
            </div>
          </div>

          {/* EXPLORAR / CATEGORIAS */}
          <div>
            <p className="text-white/90 mb-6 tracking-[0.35em] uppercase text-[10px] font-semibold">
              Explore
            </p>
            <ul className="space-y-4 text-white/50 text-xs md:text-sm">
              <li>
                <Link
                  href="/catalog"
                  className="hover:text-[var(--gold)] transition-colors inline-block"
                >
                  Lançamentos
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog?filter=mais-vendidos"
                  className="hover:text-[var(--gold)] transition-colors inline-block"
                >
                  Mais Vendidos
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog?filter=fitness"
                  className="hover:text-[var(--gold)] transition-colors inline-block"
                >
                  Coleção Fitness
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog?filter=vestidos"
                  className="hover:text-[var(--gold)] transition-colors inline-block"
                >
                  Vestidos Premium
                </Link>
              </li>
            </ul>
          </div>

          {/* INSTITUCIONAL */}
          <div>
            <p className="text-white/90 mb-6 tracking-[0.35em] uppercase text-[10px] font-semibold">
              Institucional
            </p>
            <ul className="space-y-4 text-white/50 text-xs md:text-sm">
              <li>
                <Link
                  href="/sobre"
                  className="hover:text-[var(--gold)] transition-colors inline-block"
                >
                  Sobre a Blackstore
                </Link>
              </li>
              <li>
                <Link
                  href="/trocas"
                  className="hover:text-[var(--gold)] transition-colors inline-block"
                >
                  Trocas e Devoluções
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidade"
                  className="hover:text-[var(--gold)] transition-colors inline-block"
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link
                  href="/termos"
                  className="hover:text-[var(--gold)] transition-colors inline-block"
                >
                  Termos de Serviço
                </Link>
              </li>
            </ul>
          </div>

          {/* ATENDIMENTO & SOCIAL */}
          <div>
            <p className="text-white/90 mb-6 tracking-[0.35em] uppercase text-[10px] font-semibold">
              Atendimento
            </p>
            <ul className="space-y-4 text-white/50 text-xs md:text-sm mb-8">
              <li>
                <a
                  href="mailto:contato@blackstore.com"
                  className="hover:text-[var(--gold)] transition-colors inline-block"
                >
                  contato@blackstore.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/5562994694804"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--gold)] transition-colors inline-block"
                >
                  WhatsApp: (62) 99469-4804
                </a>
              </li>
              <li>
                <span className="inline-block text-white/30">
                  Seg a Sex - 08h às 18h
                </span>
              </li>
            </ul>

            <p className="text-white/90 mb-4 tracking-[0.35em] uppercase text-[10px] font-semibold">
              Redes Sociais
            </p>
            <div className="flex items-center gap-5">
              <a
                href="https://instagram.com/blackstoreloja1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-[var(--gold)] transition-colors text-xs uppercase tracking-widest"
              >
                Instagram
              </a>
              <span className="w-1 h-1 bg-white/20 rounded-full"></span>
              <a
                href="#"
                className="text-white/50 hover:text-[var(--gold)] transition-colors text-xs uppercase tracking-widest"
              >
                TikTok
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* BASE / COPYRIGHT */}
      <div className="border-t border-white/5 bg-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[10px] text-white/40 tracking-wider text-center md:text-left">
            © {currentYear} Blackstore. Todos os direitos reservados.
            <br className="md:hidden" />
            <span className="hidden md:inline"> | </span>CNPJ:
            00.000.000/0000-00
          </div>

          <div className="flex items-center gap-3 text-white/30">
            <CreditCard size={18} />
            <span className="text-[10px] tracking-widest uppercase">
              Pagamento via PagBank
            </span>
          </div>

          <div className="text-[10px] text-white/30 tracking-wider">
            Desenvolvido por{" "}
            <span className="text-white/50 font-medium">Gildácio Júnior</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
