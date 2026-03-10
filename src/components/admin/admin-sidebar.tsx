"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageSquare,
  Tags,
  BarChart3,
  Mail,
  FileText,
  Activity,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { label: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { label: "Utilisateurs", href: "/admin/users", icon: Users },
  { label: "Livres", href: "/admin/books", icon: BookOpen },
  { label: "Feedback", href: "/admin/feedback", icon: MessageSquare },
  { label: "Tags & Ressentis", href: "/admin/tags", icon: Tags },
  { label: "Analytiques", href: "/admin/analytics", icon: BarChart3 },
  { label: "Emails", href: "/admin/emails", icon: Mail },
  { label: "Blog", href: "/admin/blog", icon: FileText },
  { label: "Santé système", href: "/admin/system", icon: Activity },
] as const;

type AdminSidebarProps = {
  collapsed: boolean;
  pathname: string;
  className?: string;
};

const isActive = (pathname: string, href: string) => {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
};

export const AdminSidebar = ({
  collapsed,
  pathname,
  className,
}: AdminSidebarProps) => {
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          className
        )}
      >
        {/* Logo */}
        <div className={cn("flex h-14 items-center border-b border-sidebar-border px-4", collapsed && "justify-center px-2")}>
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="size-5 shrink-0 text-sidebar-primary" />
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-sidebar-foreground">
                  BookMarkd
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Admin
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="flex flex-col gap-1 px-2">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.href}>{linkContent}</div>;
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-2">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/"
                  className="flex items-center justify-center rounded-md px-2 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
                >
                  <ArrowLeft className="size-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                Retour au site
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
            >
              <ArrowLeft className="size-4" />
              <span>Retour au site</span>
            </Link>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
};
