"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

export const AdminLayoutShell = ({
  children,
  pendingEditorialCount = 0,
}: {
  children: React.ReactNode;
  pendingEditorialCount?: number;
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop/Tablet sidebar */}
      <AdminSidebar
        collapsed={sidebarCollapsed}
        pathname={pathname}
        className="hidden md:flex"
        pendingEditorialCount={pendingEditorialCount}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          pathname={pathname}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
