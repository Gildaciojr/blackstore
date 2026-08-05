"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/auth";
import { 
  Package, 
  ShoppingBag, 
  MessageCircle, 
  LogOut, 
  User as UserIcon, 
  ArrowRight, 
  ShieldCheck 
} from "lucide-react";

interface BlackstoreUser {
  name?: string;
  firstName?: string;
  email?: string;
  username?: string;
}

export default function AccountPage() {
  const router = useRouter();
  
  const user = useAuth((s) => s.user) as BlackstoreUser | null;
  const logout = useAuth((s) => s.logout);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  // Fallback seguro tipado estritamente
  const userName = user?.name || user?.firstName || "Cliente Blackstore";
  const userEmail = user?.email || user?.username || "Acompanhe seus pedidos e gerencie sua conta.";

  return (
    <section className="relative min-h-[80vh] flex flex-col justify-center max-w-6xl mx-auto px-4 md:px-8 py-20 md:py-28 overflow-hidden">
      {/* GLOW DE FUNDO SUAVE */}
      <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--gold)] opacity-[0.04] blur-[150px]" />

      {/* CABEÇALHO DO PERFIL DO CLIENTE */}
      <div className="relative z-10 mb-12 md:mb-16 border-b border-white/10 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center text-[var(--gold)]">
              <UserIcon size={16} />
            </div>
            <p className="text-[10px] tracking-[0.45em] uppercase text-[var(--gold)] font-semibold flex items-center gap-1.5">
              <ShieldCheck size={12} /> Espaço do Cliente
            </p>
          </div>

          <h1 className="text-3xl md:text-5xl font-light tracking-wide leading-tight">
            Olá, <span className="bs-title font-normal">{userName}</span>
          </h1>

          <p className="mt-2 text-white/50 text-xs md:text-sm tracking-wide">
            {userEmail}
          </p>
        </div>

        {/* BOTÃO DESLOGAR */}
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/15 bg-white/5 text-white/70 hover:text-red-400 hover:border-red-400/40 hover:bg-red-500/10 text-xs uppercase tracking-[0.25em] transition-all duration-300 self-start md:self-auto"
        >
          <LogOut size={14} />
          Sair da Conta
        </button>
      </div>

      {/* GRID DE CARDS DE AÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative z-10">
        
        {/* CARD 1: MEUS PEDIDOS */}
        <Link
          href="/account/orders"
          className="group relative flex flex-col justify-between p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl hover:border-[var(--gold)]/50 hover:bg-white/[0.04] hover:shadow-[0_10px_40px_rgba(212,175,55,0.12)] transition-all duration-500 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--gold)]/5 rounded-full blur-2xl group-hover:bg-[var(--gold)]/10 transition-colors" />

          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--gold)] mb-6 group-hover:scale-110 group-hover:border-[var(--gold)]/40 transition-all duration-300">
              <Package size={22} />
            </div>

            <h2 className="uppercase tracking-[0.3em] text-sm text-white font-medium mb-2 group-hover:text-[var(--gold)] transition-colors">
              Meus Pedidos
            </h2>

            <p className="text-white/50 text-xs leading-relaxed">
              Consulte o status em tempo real, código de rastreamento e histórico de compras.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-white/60 group-hover:text-white transition-colors">
            <span>Acessar histórico</span>
            <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform text-[var(--gold)]" />
          </div>
        </Link>

        {/* CARD 2: CONTINUAR COMPRANDO */}
        <Link
          href="/catalog"
          className="group relative flex flex-col justify-between p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl hover:border-[var(--gold)]/50 hover:bg-white/[0.04] hover:shadow-[0_10px_40px_rgba(212,175,55,0.12)] transition-all duration-500 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--gold)]/5 rounded-full blur-2xl group-hover:bg-[var(--gold)]/10 transition-colors" />

          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--gold)] mb-6 group-hover:scale-110 group-hover:border-[var(--gold)]/40 transition-all duration-300">
              <ShoppingBag size={22} />
            </div>

            <h2 className="uppercase tracking-[0.3em] text-sm text-white font-medium mb-2 group-hover:text-[var(--gold)] transition-colors">
              Explorar Coleção
            </h2>

            <p className="text-white/50 text-xs leading-relaxed">
              Descubra os últimos lançamentos em moda fitness e vestidos com estética premium.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-white/60 group-hover:text-white transition-colors">
            <span>Ir para o catálogo</span>
            <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform text-[var(--gold)]" />
          </div>
        </Link>

        {/* CARD 3: ATENDIMENTO VIP / DÚVIDAS */}
        <a
          href="https://wa.me/5562994694804"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex flex-col justify-between p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl hover:border-[var(--gold)]/50 hover:bg-white/[0.04] hover:shadow-[0_10px_40px_rgba(212,175,55,0.12)] transition-all duration-500 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--gold)]/5 rounded-full blur-2xl group-hover:bg-[var(--gold)]/10 transition-colors" />

          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--gold)] mb-6 group-hover:scale-110 group-hover:border-[var(--gold)]/40 transition-all duration-300">
              <MessageCircle size={22} />
            </div>

            <h2 className="uppercase tracking-[0.3em] text-sm text-white font-medium mb-2 group-hover:text-[var(--gold)] transition-colors">
              Atendimento VIP
            </h2>

            <p className="text-white/50 text-xs leading-relaxed">
              Dúvidas sobre trocas, tamanhos ou envios? Fale diretamente com nossa equipe via WhatsApp.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-white/60 group-hover:text-white transition-colors">
            <span>Chamar no WhatsApp</span>
            <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform text-[var(--gold)]" />
          </div>
        </a>

      </div>
    </section>
  );
}