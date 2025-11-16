"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notifications/notification-bell";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavigationLink = {
  href: string;
  label: string;
  ariaLabel: string;
};

type AppShellProps = {
  children: ReactNode;
};

const navigationLinks: NavigationLink[] = [
  { href: "/feed", label: "Feed", ariaLabel: "Voir le fil d'actualité" },
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const firstName = session?.user?.name
    ? session.user.name.split(" ")[0]
    : null;

  const handleNavigateLogin = () => {
    router.push("/login");
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleMenuLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
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
                  aria-label="Créer un compte BookMarkd"
                  className="hidden text-sm text-muted-foreground sm:inline-flex"
                  asChild
                >
                  <Link href="/signup">Créer un compte</Link>
                </Button>
                <Button
                  variant="outline"
                  aria-label="Se connecter à BookMarkd"
                  onClick={handleNavigateLogin}
                  className="hidden sm:inline-flex"
                >
                  Se connecter
                </Button>
              </>
            )}
            {/* Menu burger mobile - visible uniquement sur mobile */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Ouvrir le menu de navigation"
                  className="md:hidden"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] flex h-full flex-col">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <nav aria-label="Navigation principale" className="mt-6">
                  <NavigationList emphasis="strong" onLinkClick={handleMenuLinkClick} />
                </nav>
                {/* Auth section for mobile */}
                {session?.user ? (
                  <div className="mt-auto px-2 pb-4 flex justify-center">
                    <Button
                      variant="destructive"
                      aria-label="Se déconnecter de BookMarkd"
                      className="self-center px-5"
                      onClick={() => {
                        setIsMenuOpen(false);
                        void handleSignOut();
                      }}
                    >
                      Se déconnecter
                    </Button>
                  </div>
                ) : (
                  <div className="mt-auto px-2 pb-4 grid grid-cols-1 gap-3 place-items-center">
                    <Button
                      variant="default"
                      aria-label="Se connecter à BookMarkd"
                      className="self-center px-5"
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleNavigateLogin();
                      }}
                    >
                      Se connecter
                    </Button>
                    <Button
                      variant="outline"
                      aria-label="Créer un compte BookMarkd"
                      className="self-center px-5"
                      asChild
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Link href="/signup">Créer un compte</Link>
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">{children}</div>
      </main>
    </div>
  );
};

export default AppShell;

