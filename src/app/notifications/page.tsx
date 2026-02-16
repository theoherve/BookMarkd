import type { Metadata } from "next";

import AppShell from "@/components/layout/app-shell";
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
    <AppShell>
      <div className="space-y-8">
        <BackButton ariaLabel="Retour à la page précédente" />
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Retrouvez ici vos demandes de suivi, likes, commentaires et recommandations.
          </p>
        </header>
        {isAdmin && (
          <div>
            <WrappedAdminBanner />
          </div>
        )}
        <NotificationsList />
      </div>
    </AppShell>
  );
};

export default NotificationsPage;


