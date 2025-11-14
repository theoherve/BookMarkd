"use client";

import { KeyboardEvent, ReactNode } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type NavigationLink = {
  href: string;
  label: string;
  ariaLabel: string;
};

type AppShellProps = {
  children: ReactNode;
};

const navigationLinks: NavigationLink[] = [
  { href: "/feed", label: "Feed", ariaLabel: "Voir le fil d’actualité" },
  { href: "/search", label: "Recherche", ariaLabel: "Ouvrir la recherche" },
  { href: "/lists", label: "Listes", ariaLabel: "Consulter vos listes" },
  { href: "/profiles/me", label: "Profil", ariaLabel: "Voir votre profil" },
];

const AppShell = ({ children }: AppShellProps) => {
  const router = useRouter();
  const { data: session } = useSession();
  const firstName = session?.user?.name
    ? session.user.name.split(" ")[0]
    : null;

  const handleOpenCreateDialog = () => {
    if (!session?.user) {
      router.push("/login?callbackUrl=/lists/create");
      return;
    }

    router.push("/lists/create");
  };

  const handleCreateKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenCreateDialog();
    }
  };

  const handleNavigateLogin = () => {
    router.push("/login");
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            aria-label="Retourner à l’accueil BookMarkd"
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold tracking-wide uppercase text-accent-foreground transition hover:border-accent hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            BookMarkd
          </Link>
          <nav aria-label="Navigation principale">
            <ul className="flex items-center gap-4 text-sm font-medium">
              {navigationLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-label={item.ariaLabel}
                    className="rounded-full px-3 py-2 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
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
                >
                  Se déconnecter
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                aria-label="Se connecter à BookMarkd"
                onClick={handleNavigateLogin}
              >
                Se connecter
              </Button>
            )}
            <Button
              aria-label="Ajouter un livre à votre liste de lecture"
              onClick={handleOpenCreateDialog}
              onKeyDown={handleCreateKeyDown}
            >
              Nouvelle lecture
            </Button>
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

