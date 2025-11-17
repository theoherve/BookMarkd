"use client";

import { useEffect, useTransition, useState } from "react";
import { Check, X } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getNotifications, markAllAsRead, markAsRead } from "@/server/actions/notifications";
import { acceptFollowRequest, rejectFollowRequest, findFollowRequestByRequester } from "@/server/actions/follow";
import { generateBookSlug } from "@/lib/slug";

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

  if (n.type === "follow") {
    const followerName = (n.payload.followerName as string) ?? "Un utilisateur";
    return (
      <>
        <CardTitle className="text-sm font-medium">
          Nouveau suivi
        </CardTitle>
        <CardDescription className="text-sm">
          {followerName} vous a suivi.
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
    const bookAuthor = (n.payload.bookAuthor as string) ?? "";
    const bookSlug = (n.payload.bookSlug as string) ?? "";
    const bookHref = bookSlug
      ? `/books/${bookSlug}`
      : bookTitle && bookAuthor
        ? `/books/${generateBookSlug(bookTitle, bookAuthor)}`
        : null;
    return (
      <>
        <CardTitle className="text-sm font-medium">
          Nouvelle recommandation
        </CardTitle>
        <CardDescription className="text-sm">
          Nous pensons que « {bookTitle} » pourrait vous plaire.{" "}
          {bookHref ? (
            <Link className="underline" href={bookHref}>
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
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

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

  const handleAcceptFollowRequest = async (notificationId: string, requestId: string | null, requesterId: string | null) => {
    startTransition(async () => {
      setErrorMessages((prev) => {
        const newErrors = { ...prev };
        delete newErrors[notificationId];
        return newErrors;
      });

      let finalRequestId = requestId;

      // Si le requestId n'est pas présent, essayer de le trouver via le requesterId
      if (!finalRequestId && requesterId) {
        const findResult = await findFollowRequestByRequester(requesterId);
        if (findResult.success) {
          finalRequestId = findResult.requestId;
        } else {
          setErrorMessages((prev) => ({
            ...prev,
            [notificationId]: findResult.message || "Impossible de trouver la demande.",
          }));
          return;
        }
      }

      if (!finalRequestId) {
        setErrorMessages((prev) => ({
          ...prev,
          [notificationId]: "Impossible de trouver l'ID de la demande. Veuillez rafraîchir la page.",
        }));
        return;
      }

      const result = await acceptFollowRequest(finalRequestId);
      if (result.success) {
        // Marquer la notification comme lue après acceptation
        await markAsRead(notificationId);
        await load();
      } else {
        setErrorMessages((prev) => ({
          ...prev,
          [notificationId]: result.message || "Impossible d'accepter la demande.",
        }));
      }
    });
  };

  const handleRejectFollowRequest = async (notificationId: string, requestId: string | null, requesterId: string | null) => {
    startTransition(async () => {
      setErrorMessages((prev) => {
        const newErrors = { ...prev };
        delete newErrors[notificationId];
        return newErrors;
      });

      let finalRequestId = requestId;

      // Si le requestId n'est pas présent, essayer de le trouver via le requesterId
      if (!finalRequestId && requesterId) {
        const findResult = await findFollowRequestByRequester(requesterId);
        if (findResult.success) {
          finalRequestId = findResult.requestId;
        } else {
          setErrorMessages((prev) => ({
            ...prev,
            [notificationId]: findResult.message || "Impossible de trouver la demande.",
          }));
          return;
        }
      }

      if (!finalRequestId) {
        setErrorMessages((prev) => ({
          ...prev,
          [notificationId]: "Impossible de trouver l'ID de la demande. Veuillez rafraîchir la page.",
        }));
        return;
      }

      const result = await rejectFollowRequest(finalRequestId);
      if (result.success) {
        // Marquer la notification comme lue après refus
        await markAsRead(notificationId);
        await load();
      } else {
        setErrorMessages((prev) => ({
          ...prev,
          [notificationId]: result.message || "Impossible de refuser la demande.",
        }));
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
        {notifications.map((n) => {
          // Pour les notifications de type "follow", construire l'URL du profil
          const followerId = n.type === "follow" ? (n.payload.followerId as string) ?? null : null;
          const followerUsername = n.type === "follow" ? (n.payload.followerUsername as string) ?? null : null;
          const profileUrl = followerId
            ? followerUsername
              ? `/profiles/${followerUsername}`
              : `/profiles/${followerId}`
            : null;

          const notificationCard = (
            <Card
              key={n.id}
              className={`border ${n.readAt ? "border-border/60 bg-card/60" : "border-accent/40 bg-accent/5"} ${profileUrl ? "transition hover:shadow-md cursor-pointer" : ""}`}
            >
              <CardHeader className="pb-2">
                {renderNotification(n)}
              </CardHeader>
              <CardContent className="pt-0">
                {n.type === "follow_request" && !n.readAt ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        const requestId = (n.payload.requestId as string) || null;
                        const requesterId = (n.payload.requesterId as string) || null;
                        handleAcceptFollowRequest(n.id, requestId, requesterId);
                      }}
                      disabled={isPending}
                      aria-label="Accepter la demande"
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Accepter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const requestId = (n.payload.requestId as string) || null;
                        const requesterId = (n.payload.requesterId as string) || null;
                        handleRejectFollowRequest(n.id, requestId, requesterId);
                      }}
                      disabled={isPending}
                      aria-label="Refuser la demande"
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Refuser
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMark(n.id)}
                      disabled={isPending}
                      aria-label="Marquer comme lu"
                    >
                      Marquer comme lu
                    </Button>
                  </div>
                  {errorMessages[n.id] ? (
                    <p className="text-xs text-destructive">{errorMessages[n.id]}</p>
                  ) : null}
                </div>
              ) : !n.readAt ? (
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
          );

          // Si c'est une notification de type "follow" avec une URL de profil, rendre la carte cliquable
          if (profileUrl && n.type === "follow") {
            return (
              <Link
                key={n.id}
                href={profileUrl}
                className="block"
                aria-label={`Voir le profil de ${n.payload.followerName as string ?? "l'utilisateur"}`}
                onClick={(e) => {
                  // Empêcher la navigation si on clique sur un bouton
                  const target = e.target as HTMLElement;
                  if (target.closest("button")) {
                    e.preventDefault();
                  }
                }}
              >
                {notificationCard}
              </Link>
            );
          }

          // Sinon, rendre la carte normale
          return notificationCard;
        })}
      </div>
    </div>
  );
};

export default NotificationsList;


