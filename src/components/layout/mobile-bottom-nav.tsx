"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bookmark, Search, List, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUnreadCount } from "@/server/actions/notifications";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  ariaLabel: string;
};

const navItems: NavItem[] = [
  { href: "/", label: "Accueil", icon: Bookmark, ariaLabel: "Retourner à l'accueil" },
  { href: "/search", label: "Recherche", icon: Search, ariaLabel: "Ouvrir la recherche" },
  { href: "/lists", label: "Listes", icon: List, ariaLabel: "Consulter vos listes" },
  { href: "/profiles/me", label: "Profil", icon: User, ariaLabel: "Voir votre profil" },
];

const MobileBottomNav = () => {
  const pathname = usePathname();
  const [notificationCount, setNotificationCount] = useState<number>(0);

  useEffect(() => {
    void (async () => {
      const result = await getUnreadCount();
      if (result.success) {
        setNotificationCount(result.count);
      }
    })();
  }, []);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden"
      aria-label="Navigation principale mobile"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" 
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.ariaLabel}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 rounded-lg px-4 py-2 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                isActive
                  ? "text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span className="text-xs font-medium">{item.label}</span>
              {item.href === "/profiles/me" && notificationCount > 0 ? (
                <span
                  className="absolute right-1 top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-semibold leading-none text-accent-foreground"
                  aria-label={`${notificationCount} notification${notificationCount > 1 ? "s" : ""} non lue${notificationCount > 1 ? "s" : ""}`}
                >
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;

