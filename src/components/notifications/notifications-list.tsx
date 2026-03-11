"use client";

import { useEffect, useTransition, useState } from "react";
import { Check, X, UserPlus } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getNotifications, markAllAsRead, markAsRead } from "@/server/actions/notifications";
import { acceptFollowRequest, rejectFollowRequest, findFollowRequestByRequester, requestFollow } from "@/server/actions/follow";
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
    const recommenderName = n.payload.recommenderName as string | undefined;
    const bookHref = bookSlug
      ? `/books/${bookSlug}`
      : bookTitle && bookAuthor
        ? `/books/${generateBookSlug(bookTitle, bookAuthor)}`
        : null;
    const isFromUser = Boolean(recommenderName);
    return (
      <>
        <CardTitle className="text-sm font-medium">
          Nouvelle recommandation
        </CardTitle>
        <CardDescription className="text-sm">
          {isFromUser ? (
            <>
              {recommenderName} vous recommande « {bookTitle} ».{" "}
              {bookHref ? (
                <Link className="underline" href={bookHref}>
                  Voir le livre
                </Link>
              ) : null}
            </>
          ) : (
            <>
              Nous pensons que « {bookTitle} » pourrait vous plaire.{" "}
              {bookHref ? (
                <Link className="underline" href={bookHref}>
                  Voir
                </Link>
              ) : null}
            </>
          )}
        </CardDescription>
        {common}
      </>
    );
  }

  if (n.type === "feedback_resolved") {
    const feedbackTitle = (n.payload.feedbackTitle as string) ?? "Votre feedback";
    return (
      <>
        <CardTitle className="text-sm font-medium">
          Feedback traité
        </CardTitle>
        <CardDescription className="text-sm">
          Votre feedback « {feedbackTitle} » a été marqué comme résolu. Merci pour votre contribution.
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
  const [followBackSent, setFollowBackSent] = useState<Record<string, boolean>>({});
  const [followBackPending, setFollowBackPending] = useState<Record<string, boolean>>({});
  const [acceptedRequests, setAcceptedRequests] = useState<Record<string, boolean>>({});
  const [rejectedRequests, setRejectedRequests] = useState<Record<string, boolean>>({});

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
        setAcceptedRequests((prev) => ({ ...prev, [notificationId]: true }));
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
        setRejectedRequests((prev) => ({ ...prev, [notificationId]: true }));
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

  const handleFollowBack = (requesterId: string, notificationId: string) => {
    if (!requesterId || followBackSent[requesterId] || followBackPending[requesterId]) return;
    setFollowBackPending((prev) => ({ ...prev, [requesterId]: true }));
    setErrorMessages((prev) => {
      const next = { ...prev };
      delete next[notificationId];
      return next;
    });
    requestFollow(requesterId)
      .then((result) => {
        if (result.success) {
          setFollowBackSent((prev) => ({ ...prev, [requesterId]: true }));
        } else {
          setErrorMessages((prev) => ({
            ...prev,
            [notificationId]: result.message ?? "Impossible d'envoyer la demande.",
          }));
        }
      })
      .finally(() => {
        setFollowBackPending((prev) => ({ ...prev, [requesterId]: false }));
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
          className="gap-2 cursor-pointer"
        >
          <Check className="h-4 w-4" />
          Tout marquer comme lu
        </Button>
      </div>
      <div className="space-y-3">
        {notifications.map((n) => {
          // Construire l'URL du profil pour follow et follow_request
          let profileUrl: string | null = null;
          let profileName: string | null = null;

          if (n.type === "follow") {
            const followerId = (n.payload.followerId as string) ?? null;
            const followerUsername = (n.payload.followerUsername as string) ?? null;
            profileName = (n.payload.followerName as string) ?? null;
            profileUrl = followerId
              ? `/profiles/${followerUsername ?? followerId}`
              : null;
          } else if (n.type === "follow_request") {
            const requesterId = (n.payload.requesterId as string) ?? null;
            const requesterUsername = (n.payload.requesterUsername as string) ?? null;
            profileName = (n.payload.requesterName as string) ?? null;
            profileUrl = requesterId
              ? `/profiles/${requesterUsername ?? requesterId}`
              : null;
          }

          const isAccepted = acceptedRequests[n.id];
          const isRejected = rejectedRequests[n.id];
          const showFollowRequestActions = n.type === "follow_request" && !n.readAt && !isAccepted && !isRejected;

          const notificationCard = (
            <Card
              key={n.id}
              className={`border ${n.readAt && !isAccepted ? "border-border/60 bg-card/60" : "border-accent/40 bg-accent/5"} ${profileUrl ? "transition hover:shadow-md cursor-pointer" : ""}`}
            >
              <CardHeader className="pb-2">
                {renderNotification(n)}
              </CardHeader>
              <CardContent className="pt-0">
                {showFollowRequestActions ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
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
                      className="gap-2 cursor-pointer"
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
                      className="gap-2 cursor-pointer hover:text-foreground"
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
                      className="cursor-pointer"
                    >
                      Marquer comme lu
                    </Button>
                  </div>
                  {errorMessages[n.id] ? (
                    <p className="text-xs text-destructive">{errorMessages[n.id]}</p>
                  ) : null}
                </div>
              ) : isAccepted && n.type === "follow_request" ? (
                <div className="space-y-2">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Demande acceptée
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {(() => {
                      const requesterId = (n.payload.requesterId as string) || null;
                      const sent = requesterId ? followBackSent[requesterId] : false;
                      const pending = requesterId ? followBackPending[requesterId] : false;
                      return requesterId ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFollowBack(requesterId, n.id)}
                          disabled={isPending || pending || sent}
                          aria-label={sent ? "Demande de suivi envoyée" : "Suivre en retour"}
                          className="gap-2 cursor-pointer hover:text-foreground"
                        >
                          <UserPlus className="h-4 w-4" />
                          {sent ? "Demande envoyée" : "Suivre en retour"}
                        </Button>
                      ) : null;
                    })()}
                    {profileUrl ? (
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer"
                      >
                        <Link href={profileUrl}>
                          Voir le profil
                        </Link>
                      </Button>
                    ) : null}
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
                  className="cursor-pointer"
                >
                  Marquer comme lu
                </Button>
              ) : null}
              </CardContent>
            </Card>
          );

          // Si la carte a une URL de profil et qu'on n'est PAS en état "accepté" (pour ne pas interférer avec les boutons)
          if (profileUrl && !isAccepted) {
            return (
              <Link
                key={n.id}
                href={profileUrl}
                className="block"
                aria-label={`Voir le profil de ${profileName ?? "l'utilisateur"}`}
                onClick={(e) => {
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

          return notificationCard;
        })}
      </div>
    </div>
  );
};

export default NotificationsList;


