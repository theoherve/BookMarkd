import AppShell from "@/components/layout/app-shell";
import NotificationsList from "@/components/notifications/notifications-list";

const NotificationsPage = async () => {
  return (
    <AppShell>
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Retrouvez ici vos demandes de suivi, likes, commentaires et recommandations.
          </p>
        </header>
        <NotificationsList />
      </div>
    </AppShell>
  );
};

export default NotificationsPage;


