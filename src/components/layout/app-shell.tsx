"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Menu } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import NotificationBell from "@/components/notifications/notification-bell";
import OfflineBanner from "@/components/pwa/offline-banner";
import InstallPwaCta from "@/components/pwa/install-pwa-cta";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";

type NavigationLink = {
  href: string;
  label: string;
  ariaLabel: string;
};

type AppShellProps = {
  children: ReactNode;
};

const headerNavLinks: NavigationLink[] = [
  { href: "/", label: "Accueil", ariaLabel: "Retourner à l'accueil" },
  { href: "/blog", label: "Blog", ariaLabel: "Voir le blog BookMarkd" },
  { href: "/search", label: "Recherche", ariaLabel: "Ouvrir la recherche" },
  { href: "/lists", label: "Listes", ariaLabel: "Consulter vos listes" },

];

const footerLinks: NavigationLink[] = [
  { href: "/feedback", label: "Feedback", ariaLabel: "Suggérer une fonctionnalité ou rapporter une erreur" },
  { href: "/about", label: "À propos", ariaLabel: "À propos de BookMarkd" },
  { href: "/faq", label: "FAQ", ariaLabel: "Foire aux questions" },
];

const mobileMenuLinks: NavigationLink[] = [...headerNavLinks, ...footerLinks];

const getInitials = (name: string | null): string => {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const HeaderNavList = ({ onLinkClick }: { onLinkClick?: () => void }) => {
  const linkClass =
    "block rounded-full px-3 py-2 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent";
  return (
    <ul className="flex flex-col gap-2 text-sm font-medium md:flex-row md:items-center md:gap-4">
      {headerNavLinks.map((item) => (
        <li key={item.href}>
          <Link href={item.href} aria-label={item.ariaLabel} onClick={onLinkClick} className={linkClass}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
};

const AppShell = ({ children }: AppShellProps) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigateLogin = () => {
    router.push("/login");
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleMobileLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2 md:gap-0">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Ouvrir le menu"
                  className="md:hidden"
                >
                  <Menu className="size-5" aria-hidden />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(20rem,85vw)]">
                <SheetHeader>
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                </SheetHeader>
                <nav aria-label="Navigation mobile" className="flex flex-col gap-1 pt-4">
                  {mobileMenuLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-label={item.ariaLabel}
                      onClick={handleMobileLinkClick}
                      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            <Link
              href="/"
              aria-label="Retourner à l'accueil BookMarkd"
              className="rounded-full px-4 py-2 text-sm font-semibold tracking-wide uppercase text-accent-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              BookMarkd
            </Link>
          </div>

          <nav aria-label="Navigation principale" className="hidden md:block">
            <HeaderNavList />
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {session?.user ? (
              <>
                <Button
                  variant="default"
                  size="sm"
                  aria-label="Ajouter un livre à la bibliothèque"
                  className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                  asChild
                >
                  <Link href="/books/create">
                    <Plus className="size-4" aria-hidden />
                    <span className="hidden sm:inline">Ajouter un livre</span>
                  </Link>
                </Button>
                <NotificationBell />
                <div className="hidden md:block">
                  <DropdownMenuRoot>
                    <DropdownMenuTrigger
                      aria-label="Menu compte utilisateur"
                      className="flex shrink-0 rounded-full ring-2 ring-border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    >
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt=""
                          width={32}
                          height={32}
                          className="size-8 rounded-full object-cover"
                        />
                      ) : (
                        <span
                          className="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
                          aria-hidden
                        >
                          {getInitials(session.user.name ?? null)}
                        </span>
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Link href="/profiles/me" className="block w-full px-2 py-1.5 text-left text-sm">
                          Mon profil
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full px-2 py-1.5 text-left text-sm text-foreground"
                        >
                          Se déconnecter
                        </button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenuRoot>
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Créer un compte BookMarkd"
                  className="hidden text-xs text-muted-foreground sm:inline-flex"
                  asChild
                >
                  <Link href="/signup">S&apos;inscrire</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Se connecter à BookMarkd"
                  onClick={handleNavigateLogin}
                  className="text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Se connecter</span>
                  <span className="sm:hidden">Connexion</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <OfflineBanner />
      <main className="flex-1 pb-24 safe-area-bottom-offset md:pb-0">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-10">
          {children}
        </div>
      </main>
      <footer className="hidden border-t border-border bg-card/40 py-6 md:block">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 text-center text-sm text-muted-foreground">
          {footerLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.ariaLabel}
              className="hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </footer>
      <MobileBottomNav />
      <InstallPwaCta />
    </div>
  );
};

export default AppShell;

