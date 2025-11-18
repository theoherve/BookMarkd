"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";

import { Button } from "@/components/ui/button";

const OfflinePage = () => {
  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 text-center">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <WifiOff className="size-12 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Vous êtes hors ligne
          </h1>
          <p className="text-muted-foreground">
            Il semble que vous n&apos;ayez pas de connexion internet. Vérifiez
            votre connexion et réessayez.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-center">
          <Button
            onClick={handleReload}
            className="flex items-center gap-2"
            aria-label="Recharger la page"
          >
            <RefreshCw className="size-4" />
            Recharger
          </Button>
          <Button
            variant="outline"
            asChild
            className="flex items-center gap-2"
            aria-label="Retourner à l'accueil"
          >
            <Link href="/">
              <Home className="size-4" />
              Accueil
            </Link>
          </Button>
        </div>

        <div className="pt-8 text-sm text-muted-foreground">
          <p>
            Certaines pages peuvent être disponibles hors ligne grâce au cache.
            Essayez de naviguer vers une page que vous avez déjà visitée.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;

