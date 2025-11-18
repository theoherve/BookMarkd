"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type ServiceWorkerProviderProps = {
  children: React.ReactNode;
};

const ServiceWorkerProvider = ({ children }: ServiceWorkerProviderProps) => {
  const pathname = usePathname();

  useEffect(() => {
    const isPWAEnabled =
      process.env.NEXT_PUBLIC_ENABLE_PWA === "true" ||
      (process.env.NEXT_PUBLIC_ENABLE_PWA !== "false" &&
        process.env.NODE_ENV === "production");

    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      isPWAEnabled
    ) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          });

          // Gérer les mises à jour du service worker
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // Nouveau service worker disponible
                  console.log("Nouveau service worker disponible");
                  // Optionnel : afficher un toast pour demander à l'utilisateur de recharger
                }
              });
            }
          });

          // Écouter les changements de contrôleur (mise à jour activée)
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            console.log("Service worker mis à jour");
            // Optionnel : recharger automatiquement la page
            // window.location.reload();
          });
        } catch (error) {
          console.error("Erreur lors de l'enregistrement du service worker:", error);
        }
      };

      void registerServiceWorker();
    }
  }, [pathname]);

  return <>{children}</>;
};

export default ServiceWorkerProvider;

