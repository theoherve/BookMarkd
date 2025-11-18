"use client";

import { Download, X } from "lucide-react";
import { useState } from "react";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { Button } from "@/components/ui/button";

const InstallPwaCta = () => {
  const { canInstall, showInstallPrompt, isStandalone } = useInstallPrompt();
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("pwa-install-dismissed") === "true";
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  const handleInstall = async () => {
    const installed = await showInstallPrompt();
    if (installed) {
      setIsDismissed(true);
      localStorage.setItem("pwa-install-dismissed", "true");
    }
  };

  if (isStandalone || !canInstall || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform sm:bottom-6">
      <div className="mx-auto max-w-md rounded-lg border border-border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              Installer BookMarkd
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Ajoutez BookMarkd à votre écran d&apos;accueil pour un accès
              rapide.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            aria-label="Fermer"
            className="size-6 shrink-0"
          >
            <X className="size-3" />
          </Button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            onClick={handleInstall}
            className="flex-1"
            aria-label="Installer l'application"
          >
            <Download className="mr-2 size-4" />
            Installer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstallPwaCta;

