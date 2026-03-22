"use client";

import AdminLayout from "@/components/layout/AdminLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayout>
      <div className="w-full">
        {children}
      </div>
    </AdminLayout>
  );
}