"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";

type AdminHeaderProps = {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  pathname: string;
};

export const AdminHeader = ({
  sidebarCollapsed,
  onToggleSidebar,
  pathname,
}: AdminHeaderProps) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={() => setMobileNavOpen(true)}
      >
        <Menu className="size-5" />
        <span className="sr-only">Menu</span>
      </Button>

      {/* Desktop collapse toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="hidden md:inline-flex"
        onClick={onToggleSidebar}
      >
        {sidebarCollapsed ? (
          <PanelLeftOpen className="size-4" />
        ) : (
          <PanelLeftClose className="size-4" />
        )}
        <span className="sr-only">
          {sidebarCollapsed ? "Ouvrir la sidebar" : "Fermer la sidebar"}
        </span>
      </Button>

      {/* Breadcrumb */}
      <AdminBreadcrumb pathname={pathname} />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Back to site link (desktop) */}
      <Link
        href="/"
        className="hidden text-xs text-muted-foreground hover:text-foreground md:block"
      >
        bookmarkd.app
      </Link>

      {/* Mobile Sheet Nav */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation admin</SheetTitle>
          </SheetHeader>
          <AdminSidebar
            collapsed={false}
            pathname={pathname}
            className="flex h-full w-full border-r-0"
          />
        </SheetContent>
      </Sheet>
    </header>
  );
};
