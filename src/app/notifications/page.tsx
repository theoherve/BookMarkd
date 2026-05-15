import type { Metadata } from "next";
import { Bell } from "lucide-react";

import BackButton from "@/components/layout/back-button";
import NotificationsList from "@/components/notifications/notifications-list";
import WrappedAdminBanner from "@/components/wrapped/WrappedAdminBanner";
import { getCurrentUserAdminStatus } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Vos demandes de suivi, likes, commentaires et recommandations.",
  robots: { index: false, follow: false },
};

const NotificationsPage = async () => {
  const isAdmin = await getCurrentUserAdminStatus();

  return (
    <>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <BackButton ariaLabel="Retour à la page précédente" />

        <header className="space-y-3 border-b border-border/50 pb-6">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent-foreground ring-1 ring-accent/30"
            >
              <Bell className="h-4.5 w-4.5" strokeWidth={1.75} />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Notifications
            </h1>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Vos demandes de suivi, likes, commentaires et recommandations, rassemblés ici.
          </p>
        </header>

        {isAdmin ? <WrappedAdminBanner /> : null}

        <NotificationsList />
      </div>
    </>
  );
};

export default NotificationsPage;


