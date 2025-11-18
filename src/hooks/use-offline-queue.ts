"use client";

import { useState, useEffect, useCallback } from "react";
import { addOfflineAction, getPendingActions } from "@/lib/pwa/offline-queue";
import { syncOfflineActions } from "@/lib/pwa/offline-sync";
import type { OfflineActionPayload } from "@/types/offline-actions";

export const useOfflineQueue = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true,
  );
  const [isSyncing, setIsSyncing] = useState(false);

  const updatePendingCount = useCallback(async () => {
    const actions = await getPendingActions();
    setPendingCount(actions.length);
  }, []);

  useEffect(() => {
    void updatePendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      void syncOfflineActions().then(() => {
        void updatePendingCount();
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [updatePendingCount]);

  const queueAction = useCallback(
    async (payload: OfflineActionPayload) => {
      if (isOnline) {
        try {
          const response = await fetch("/api/pwa/offline-actions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const result = await response.json();

          if (!result.success || !response.ok) {
            // Si l'action échoue (erreur serveur, auth, etc.), on la met en queue
            await addOfflineAction({ type: payload.type, payload });
            await updatePendingCount();
            return { success: true, queued: true };
          }

          return { success: true };
        } catch {
          // Erreur réseau ou autre : on met en queue pour retry plus tard
          await addOfflineAction({ type: payload.type, payload });
          await updatePendingCount();
          return { success: true, queued: true };
        }
      } else {
        await addOfflineAction({ type: payload.type, payload });
        await updatePendingCount();
        return { success: true, queued: true };
      }
    },
    [isOnline, updatePendingCount],
  );

  const handleSync = useCallback(async () => {
    if (!isOnline || isSyncing) {
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncOfflineActions();
      await updatePendingCount();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, updatePendingCount]);

  return {
    queueAction,
    handleSync,
    pendingCount,
    isOnline,
    isSyncing,
    updatePendingCount,
  };
};

