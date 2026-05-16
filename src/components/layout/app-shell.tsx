"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Menu,
  LayoutDashboard,
  Home,
  Search,
  Sparkles,
  List,
  BookOpen,
  MessageSquare,
  Info,
  HelpCircle,
  ChevronRight,
  LogOut,
  type LucideIcon,
} from "lucide-react";
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
import ScanFab from "@/components/scan/scan-fab";

type NavigationLink = {
  href: string;
  label: string;
  ariaLabel: string;
};

type MobileNavItem = NavigationLink & {
  icon: LucideIcon;
  hint?: string;
};

type AppShellProps = {
  children: ReactNode;
};

const headerNavLinks: NavigationLink[] = [
  { href: "/", label: "Accueil", ariaLabel: "Retourner à l'accueil" },
  { href: "/blog", label: "Blog", ariaLabel: "Voir le blog BookMarkd" },
  { href: "/search", label: "Recherche", ariaLabel: "Ouvrir la recherche" },
  { href: "/discover", label: "Découvrir", ariaLabel: "Découvrir des livres" },
  { href: "/lists", label: "Listes", ariaLabel: "Consulter vos listes" },

];

const footerLinks: NavigationLink[] = [
  { href: "/feedback", label: "Feedback", ariaLabel: "Suggérer une fonctionnalité ou rapporter une erreur" },
  { href: "/about", label: "À propos", ariaLabel: "À propos de BookMarkd" },
  { href: "/faq", label: "FAQ", ariaLabel: "Foire aux questions" },
];

const mobilePrimaryNav: MobileNavItem[] = [
  { href: "/", label: "Accueil", icon: Home, ariaLabel: "Retourner à l'accueil" },
  { href: "/search", label: "Recherche", icon: Search, ariaLabel: "Ouvrir la recherche" },
  { href: "/discover", label: "Découvrir", icon: Sparkles, ariaLabel: "Découvrir des livres", hint: "Swipe deck" },
  { href: "/lists", label: "Listes", icon: List, ariaLabel: "Consulter vos listes" },
  { href: "/blog", label: "Blog", icon: BookOpen, ariaLabel: "Voir le blog BookMarkd" },
];

const mobileSecondaryNav: MobileNavItem[] = [
  { href: "/feedback", label: "Feedback", icon: MessageSquare, ariaLabel: "Suggérer une fonctionnalité ou rapporter une erreur" },
  { href: "/about", label: "À propos", icon: Info, ariaLabel: "À propos de BookMarkd" },
  { href: "/faq", label: "FAQ", icon: HelpCircle, ariaLabel: "Foire aux questions" },
];

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

const MobileNavRow = ({
  item,
  onClick,
  index,
}: {
  item: MobileNavItem;
  onClick: () => void;
  index: number;
}) => {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-label={item.ariaLabel}
      onClick={onClick}
      style={{ animationDelay: `${index * 35}ms` }}
      className="group relative flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-foreground transition motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 motion-safe:duration-300 hover:bg-accent/15 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground transition group-hover:bg-accent group-hover:text-accent-foreground"
        aria-hidden
      >
        <Icon className="size-[18px]" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block truncate">{item.label}</span>
        {item.hint ? (
          <span className="block truncate text-xs text-muted-foreground">
            {item.hint}
          </span>
        ) : null}
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground/60 transition group-hover:translate-x-0.5 group-hover:text-foreground"
        aria-hidden
      />
    </Link>
  );
};

const AppShell = ({ children }: AppShellProps) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isSessionLoading = status === "loading";

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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Aller au contenu principal
      </a>
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
              <SheetContent
                side="left"
                className="w-[min(22rem,88vw)] gap-0 border-r border-border bg-[linear-gradient(180deg,var(--card)_0%,var(--background)_100%)] p-0"
              >
                <SheetHeader className="border-b border-border/60 px-6 pt-7 pb-5">
                  <SheetTitle className="sr-only">Menu BookMarkd</SheetTitle>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
                      BookMarkd
                    </span>
                  </div>
                  <p className="font-display text-sm italic text-muted-foreground">
                    Votre bibliothèque, partagée.
                  </p>
                </SheetHeader>

                <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5">
                  {session?.user ? (
                    <Link
                      href="/profiles/me"
                      onClick={handleMobileLinkClick}
                      aria-label="Voir mon profil"
                      className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card/70 p-3 shadow-sm transition hover:border-accent hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt="Photo de profil"
                          width={44}
                          height={44}
                          className="size-11 rounded-full object-cover ring-2 ring-border"
                        />
                      ) : (
                        <span
                          className="flex size-11 items-center justify-center rounded-full bg-accent text-base font-semibold text-accent-foreground ring-2 ring-border"
                          aria-hidden
                        >
                          {getInitials(session.user.name ?? null)}
                        </span>
                      )}
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {session.user.name ?? "Lecteur·rice"}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          Voir mon profil
                        </span>
                      </span>
                      <ChevronRight
                        className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground"
                        aria-hidden
                      />
                    </Link>
                  ) : (
                    <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm">
                      <p className="font-display text-sm italic text-foreground">
                        Rejoins la communauté de lecteur·rice·s.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                          asChild
                        >
                          <Link href="/signup" onClick={handleMobileLinkClick}>
                            S&apos;inscrire
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <Link href="/login" onClick={handleMobileLinkClick}>
                            Connexion
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}

                  <nav aria-label="Navigation mobile" className="flex flex-col gap-6">
                    <section className="flex flex-col gap-1">
                      <div className="flex items-center gap-3 px-3 pb-1">
                        <span className="h-px flex-1 bg-border" aria-hidden />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Naviguer
                        </span>
                        <span className="h-px flex-1 bg-border" aria-hidden />
                      </div>
                      {mobilePrimaryNav.map((item, index) => (
                        <MobileNavRow
                          key={item.href}
                          item={item}
                          onClick={handleMobileLinkClick}
                          index={index}
                        />
                      ))}
                    </section>

                    <section className="flex flex-col gap-1">
                      <div className="flex items-center gap-3 px-3 pb-1">
                        <span className="h-px flex-1 bg-border" aria-hidden />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Aide & info
                        </span>
                        <span className="h-px flex-1 bg-border" aria-hidden />
                      </div>
                      {mobileSecondaryNav.map((item, index) => (
                        <MobileNavRow
                          key={item.href}
                          item={item}
                          onClick={handleMobileLinkClick}
                          index={mobilePrimaryNav.length + index}
                        />
                      ))}
                    </section>

                    {session?.user?.isAdmin ? (
                      <section className="flex flex-col gap-1">
                        <div className="flex items-center gap-3 px-3 pb-1">
                          <span className="h-px flex-1 bg-border" aria-hidden />
                          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Admin
                          </span>
                          <span className="h-px flex-1 bg-border" aria-hidden />
                        </div>
                        <MobileNavRow
                          item={{
                            href: "/admin",
                            label: "Dashboard",
                            icon: LayoutDashboard,
                            ariaLabel: "Accéder au dashboard admin",
                          }}
                          onClick={handleMobileLinkClick}
                          index={0}
                        />
                      </section>
                    ) : null}
                  </nav>
                </div>

                {session?.user ? (
                  <div className="border-t border-border/60 px-4 py-4 safe-area-inset-bottom">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        void handleSignOut();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                    >
                      <LogOut className="size-4" aria-hidden />
                      Se déconnecter
                    </button>
                  </div>
                ) : null}
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
            {isSessionLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              </div>
            ) : session?.user ? (
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
                      className="flex shrink-0 cursor-pointer rounded-full ring-2 ring-border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    >
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt="Photo de profil"
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
                      {session.user.isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Link href="/admin" className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm">
                              <LayoutDashboard className="size-4" />
                              Dashboard
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
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
      <main id="main-content" className="flex-1 pb-24 safe-area-bottom-offset md:pb-0">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-10">
          {children}
        </div>
      </main>
      <footer className="hidden border-t border-border bg-card/40 py-6 md:block">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <Link
            href="https://github.com/theoherve"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Profil GitHub de Théo HERVÉ"
            className="hover:text-foreground"
          >
            © BookMarkd by Théo HERVÉ - Tous droits réservés
          </Link>
          |
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
        </div>
      </footer>
      <MobileBottomNav />
      <ScanFab />
      <InstallPwaCta />
    </div>
  );
};

export default AppShell;

