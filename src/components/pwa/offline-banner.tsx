"use client";

import { useState } from "react";
import { WifiOff, RefreshCw, X } from "lucide-react";
import { useOfflineQueue } from "@/hooks/use-offline-queue";
import { Button } from "@/components/ui/button";

const OfflineBanner = () => {
  const { isOnline, pendingCount, isSyncing, handleSync } = useOfflineQueue();
  const [isManuallyHidden, setIsManuallyHidden] = useState(false);
  const isVisible = !isManuallyHidden && (!isOnline || pendingCount > 0);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="border-b border-border bg-muted/50 px-6 py-3 text-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {!isOnline ? (
            <>
              <WifiOff className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Vous êtes hors ligne. Vos actions seront synchronisées automatiquement.
              </span>
            </>
          ) : pendingCount > 0 ? (
            <>
              <RefreshCw className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {pendingCount} action{pendingCount > 1 ? "s" : ""} en attente de
                synchronisation
              </span>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {isOnline && pendingCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleSync()}
              disabled={isSyncing}
              aria-label="Synchroniser les actions en attente"
            >
              <RefreshCw
                className={`size-4 ${isSyncing ? "animate-spin" : ""}`}
              />
              Synchroniser
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsManuallyHidden(true)}
            aria-label="Masquer la bannière"
            className="size-8"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OfflineBanner;

