import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="max-w-7xl mx-auto px-8 pt-32 pb-32">
      <div className="flex flex-col lg:flex-row gap-16">
        <aside className="w-full lg:w-64 border border-white/10 bg-black/40 backdrop-blur p-8 h-fit">
          <p className="text-xs tracking-widest uppercase text-white/50">
            Admin
          </p>

          <h2 className="mt-4 text-xl tracking-widest uppercase bs-title bs-title-hover">
            Blackstore
          </h2>

          <nav className="mt-10 space-y-4 text-sm">
            <Link className="block text-white/70 hover:text-white transition" href="/dashboard">
              Visão geral
            </Link>
            <Link className="block text-white/70 hover:text-white transition" href="/dashboard/products">
              Produtos
            </Link>
            <Link className="block text-white/70 hover:text-white transition" href="/dashboard/orders">
              Pedidos
            </Link>

            <form
              className="pt-6 border-t border-white/10"
              action="/api/admin/logout"
              method="post"
            >
              <button
                className="
                  w-full mt-2 py-3 rounded-full
                  border border-white/15
                  text-xs tracking-[0.35em] uppercase text-white/70
                  hover:border-white/40 hover:text-white transition
                "
              >
                Sair
              </button>
            </form>
          </nav>
        </aside>

        <div className="flex-1">{children}</div>
      </div>
    </section>
  );
}