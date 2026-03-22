"use client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white flex">

      {/* SIDEBAR DESKTOP */}
      <div className="hidden lg:block">
        {/* sidebar será injetada no layout pai depois */}
      </div>

      {/* CONTEÚDO */}
      <div className="flex-1 w-full flex flex-col">

        {/* ambient light */}
        <div
          className="
          fixed
          w-[800px]
          h-[800px]
          bg-[var(--gold)]
          opacity-[0.04]
          blur-[220px]
          rounded-full
          top-[-350px]
          left-1/2
          -translate-x-1/2
          pointer-events-none
          z-0
          "
        />

        <main
          className="
          relative
          w-full
          max-w-7xl
          mx-auto
          px-4 sm:px-6 md:px-10
          py-8 sm:py-10 md:py-14
          z-10
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}