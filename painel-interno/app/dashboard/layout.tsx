"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayout>

      <div className="flex w-full">

        {/* 🔥 SIDEBAR (desktop + mobile já resolvido) */}
        <AdminSidebar />

        {/* 🔥 CONTEÚDO */}
        <div className="flex-1 w-full">
          {children}
        </div>

      </div>

    </AdminLayout>
  );
}