"use client";

type Props = {
  search: string
  setSearch: (v:string)=>void
}

export default function ProductFilters({search,setSearch}:Props){

  return(

    <div className="mb-6">

      <input
      value={search}
      onChange={(e)=>setSearch(e.target.value)}
      placeholder="Buscar produto..."
      className="bg-black border border-white/20 p-3 w-80"
      />

    </div>

  )

}