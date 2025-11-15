"use client";

import { useEffect, useTransition, useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getNotifications, markAllAsRead, markAsRead } from "@/server/actions/notifications";

type UiNotification = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

const renderNotification = (n: UiNotification) => {
  const created = new Date(n.createdAt).toLocaleString();
  const common = (
    <p className="text-xs text-muted-foreground">{created}</p>
  );

  if (n.type === "follow_request") {
    const requesterName = (n.payload.requesterName as string) ?? "Un utilisateur";
    return (
      <>
        <CardTitle className="text-sm font-medium">
          Nouvelle demande de suivi
        </CardTitle>
        <CardDescription className="text-sm">
          {requesterName} souhaite vous suivre.
        </CardDescription>
        {common}
      </>
    );
  }

  if (n.type === "follow_request_accepted") {
    const targetName = (n.payload.targetUserName as string) ?? "Un utilisateur";
    return (
      <>
        <CardTitle className="text-sm font-medium">
          Demande de suivi acceptée
        </CardTitle>
        <CardDescription className="text-sm">
          {targetName} a accepté votre demande.
        </CardDescription>
        {common}
      </>
    );
  }

  if (n.type === "review_like") {
    const bookTitle = (n.payload.bookTitle as string) ?? "un livre";
    return (
      <>
        <CardTitle className="text-sm font-medium">
          Nouveau like sur votre review
        </CardTitle>
        <CardDescription className="text-sm">
          Quelqu&apos;un a liké votre review sur « {bookTitle} ».
        </CardDescription>
        {common}
      </>
    );
  }

  if (n.type === "review_comment") {
    const bookTitle = (n.payload.bookTitle as string) ?? "un livre";
    return (
      <>
        <CardTitle className="text-sm font-medium">
          Nouveau commentaire
        </CardTitle>
        <CardDescription className="text-sm">
          Vous avez reçu un commentaire sur « {bookTitle} ».
        </CardDescription>
        {common}
      </>
    );
  }

  if (n.type === "recommendation") {
    const bookTitle = (n.payload.bookTitle as string) ?? "un livre";
    const bookSlug = (n.payload.bookSlug as string) ?? "";
    return (
      <>
        <CardTitle className="text-sm font-medium">
          Nouvelle recommandation
        </CardTitle>
        <CardDescription className="text-sm">
          Nous pensons que « {bookTitle} » pourrait vous plaire.{" "}
          {bookSlug ? (
            <Link className="underline" href={`/books/${bookSlug}`}>
              Voir
            </Link>
          ) : null}
        </CardDescription>
        {common}
      </>
    );
  }

  return (
    <>
      <CardTitle className="text-sm font-medium">Notification</CardTitle>
      <CardDescription className="text-sm">
        Une nouvelle activité a été enregistrée.
      </CardDescription>
      {common}
    </>
  );
};

const NotificationsList = () => {
  const [notifications, setNotifications] = useState<UiNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const load = async () => {
    const result = await getNotifications(50);
    if (result.success) {
      setNotifications(result.notifications);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      await load();
    })();
  }, []);

  const handleMarkAll = () => {
    startTransition(async () => {
      const result = await markAllAsRead();
      if (result.success) {
        await load();
      }
    });
  };

  const handleMark = (id: string) => {
    startTransition(async () => {
      const result = await markAsRead(id);
      if (result.success) {
        await load();
      }
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/60 p-8 text-center text-sm text-muted-foreground">
        Aucune notification.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAll}
          disabled={isPending}
          aria-label="Tout marquer comme lu"
          className="gap-2"
        >
          <Check className="h-4 w-4" />
          Tout marquer comme lu
        </Button>
      </div>
      <div className="space-y-3">
        {notifications.map((n) => (
          <Card
            key={n.id}
            className={`border ${n.readAt ? "border-border/60 bg-card/60" : "border-accent/40 bg-accent/5"}`}
          >
            <CardHeader className="pb-2">
              {renderNotification(n)}
            </CardHeader>
            <CardContent className="pt-0">
              {!n.readAt ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMark(n.id)}
                  disabled={isPending}
                  aria-label="Marquer comme lu"
                >
                  Marquer comme lu
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NotificationsList;


