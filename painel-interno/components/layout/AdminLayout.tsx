"use client";

export default function AdminLayout({
  children,
}:{
  children:React.ReactNode
}){

  return(

    <div
      className="
      min-h-screen
      bg-[#0b0b0d]
      text-white
      flex
      flex-col
      items-center
      "
    >

      {/* ambient light */}

      <div
        className="
        absolute
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
        "
      />

      <main
        className="
        relative
        w-full
        max-w-7xl
        px-6 md:px-10
        py-14
        "
      >

        {children}

      </main>

    </div>

  );

}