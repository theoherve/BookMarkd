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

    // Vérifier l'état initial
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const handleOnline = () => {
      // Vérifier navigator.onLine immédiatement et aussi dans un setTimeout
      // pour gérer les cas où la propriété est modifiée de manière asynchrone
      const currentStatus = navigator.onLine;
      setIsOnline(currentStatus);
      
      setTimeout(() => {
        // Vérifier à nouveau au cas où navigator.onLine aurait changé
        if (navigator.onLine !== currentStatus) {
          setIsOnline(navigator.onLine);
        }
        if (navigator.onLine) {
          void syncOfflineActions().then(() => {
            void updatePendingCount();
          });
        }
      }, 0);
    };

    const handleOffline = () => {
      // Vérifier navigator.onLine immédiatement et aussi dans un setTimeout
      // pour gérer les cas où la propriété est modifiée de manière asynchrone
      const currentStatus = navigator.onLine;
      setIsOnline(currentStatus);
      
      setTimeout(() => {
        // Vérifier à nouveau au cas où navigator.onLine aurait changé
        if (navigator.onLine !== currentStatus) {
          setIsOnline(navigator.onLine);
        }
      }, 0);
    };

    // Vérifier l'état initial
    checkOnlineStatus();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Vérifier périodiquement l'état (pour les cas où les événements ne sont pas fiables)
    const interval = setInterval(checkOnlineStatus, 1000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
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

