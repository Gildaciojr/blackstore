"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import CustomerTable from "./components/CustomerTable";
import CustomerDetails from "./components/CustomerDetails";

import { Customer } from "./types/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);

  async function loadCustomers() {
    const data = await apiFetch<Customer[]>("/admin/customers");

    setCustomers(data);
  }

useEffect(() => {

  queueMicrotask(() => {
    loadCustomers();
  });

}, []);

  return (
    <section>
      <h1 className="text-3xl mb-10">Clientes</h1>

      <CustomerTable customers={customers} onSelect={(c) => setSelected(c)} />

      <CustomerDetails customer={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
