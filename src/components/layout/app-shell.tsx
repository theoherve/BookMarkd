"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
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

const navigationLinks: NavigationLink[] = [
  { href: "/", label: "Accueil", ariaLabel: "Retourner à l'accueil" },
  { href: "/search", label: "Recherche", ariaLabel: "Ouvrir la recherche" },
  { href: "/lists", label: "Listes", ariaLabel: "Consulter vos listes" },
  { href: "/profiles/me", label: "Profil", ariaLabel: "Voir votre profil" },
];

const NavigationList = ({ onLinkClick, emphasis = "normal" }: { onLinkClick?: () => void; emphasis?: "normal" | "strong" }) => {
  const linkClass = emphasis === "strong"
    ? "block rounded-full px-3 py-2 text-foreground transition hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
    : "block rounded-full px-3 py-2 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent";
  return (
    <ul className="flex flex-col gap-2 text-sm font-medium md:flex-row md:items-center md:gap-4">
      {navigationLinks.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            aria-label={item.ariaLabel}
            onClick={onLinkClick}
            className={linkClass}
          >
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
  const firstName = session?.user?.name
    ? session.user.name.split(" ")[0]
    : null;

  const handleNavigateLogin = () => {
    router.push("/login");
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            aria-label="Retourner à l'accueil BookMarkd"
            className="rounded-full px-4 py-2 text-sm font-semibold tracking-wide uppercase text-accent-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            BookMarkd
          </Link>
          
          {/* Navigation desktop - cachée sur mobile */}
          <nav aria-label="Navigation principale" className="hidden md:block">
            <NavigationList />
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {session?.user ? (
              <>
                <NotificationBell />
                <p className="hidden text-sm text-muted-foreground sm:block">
                  Bonjour,{" "}
                  <span className="font-semibold text-foreground">
                    {firstName ?? session.user.name}
                  </span>
                </p>
                <Button
                  variant="outline"
                  aria-label="Se déconnecter de BookMarkd"
                  onClick={handleSignOut}
                  className="hidden sm:inline-flex"
                >
                  Se déconnecter
                </Button>
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
      <MobileBottomNav />
      <InstallPwaCta />
    </div>
  );
};

export default AppShell;

