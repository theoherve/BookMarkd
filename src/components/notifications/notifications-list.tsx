"use client";

import { useEffect, useTransition, useState, useMemo } from "react";
import {
  Check,
  X,
  UserPlus,
  Heart,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  Bell,
  Inbox,
  Trophy,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getNotifications, markAllAsRead, markAsRead } from "@/server/actions/notifications";
import {
  acceptFollowRequest,
  rejectFollowRequest,
  findFollowRequestByRequester,
  requestFollow,
} from "@/server/actions/follow";
import { generateBookSlug } from "@/lib/slug";
import { formatRelativeTimeFromNow } from "@/lib/datetime";

type UiNotification = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

type Filter = "all" | "unread";

type IconBadge = {
  Icon: typeof Heart;
  tone: "rose" | "sky" | "amber" | "violet" | "emerald" | "neutral";
};

const ICON_BY_TYPE: Record<string, IconBadge> = {
  review_like: { Icon: Heart, tone: "rose" },
  review_comment: { Icon: MessageCircle, tone: "sky" },
  follow: { Icon: UserPlus, tone: "amber" },
  follow_request: { Icon: UserPlus, tone: "amber" },
  follow_request_accepted: { Icon: CheckCircle2, tone: "emerald" },
  recommendation: { Icon: Sparkles, tone: "violet" },
  feedback_resolved: { Icon: CheckCircle2, tone: "emerald" },
  awards_announcement: { Icon: Trophy, tone: "amber" },
  awards_winner: { Icon: Trophy, tone: "amber" },
};

const AWARDS_CATEGORY_LABEL: Record<string, string> = {
  book_of_the_year: "Livre de l'année",
  reader_of_the_year: "Lecteur de l'année",
  top_categories: "Catégories phares",
  top_reviewer: "Critique de l'année",
  most_loved_review: "Critique la plus aimée",
  trending_wishlist: "Livre le plus convoité",
  best_newcomer: "Révélation de l'année",
  feeling_award: "Sentiment de l'année",
};

const TONE_CLASSES: Record<IconBadge["tone"], string> = {
  rose: "bg-rose-500/10 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300 ring-rose-500/20",
  sky: "bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300 ring-sky-500/20",
  amber:
    "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300 ring-amber-500/20",
  violet:
    "bg-violet-500/10 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300 ring-violet-500/20",
  emerald:
    "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300 ring-emerald-500/20",
  neutral: "bg-muted text-muted-foreground ring-border",
};

const getBadge = (type: string): IconBadge =>
  ICON_BY_TYPE[type] ?? { Icon: Bell, tone: "neutral" };

const NotificationIcon = ({ type }: { type: string }) => {
  const { Icon, tone } = getBadge(type);
  return (
    <span
      aria-hidden
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ${TONE_CLASSES[tone]}`}
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} />
    </span>
  );
};

const renderBody = (n: UiNotification) => {
  if (n.type === "follow_request") {
    const requesterName = (n.payload.requesterName as string) ?? "Un utilisateur";
    return (
      <>
        <p className="text-sm font-medium text-foreground">Nouvelle demande de suivi</p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{requesterName}</span> souhaite vous suivre.
        </p>
      </>
    );
  }

  if (n.type === "follow_request_accepted") {
    const targetName = (n.payload.targetUserName as string) ?? "Un utilisateur";
    return (
      <>
        <p className="text-sm font-medium text-foreground">Demande de suivi acceptée</p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{targetName}</span> a accepté votre demande.
        </p>
      </>
    );
  }

  if (n.type === "follow") {
    const followerName = (n.payload.followerName as string) ?? "Un utilisateur";
    return (
      <>
        <p className="text-sm font-medium text-foreground">Nouvel abonné</p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{followerName}</span> vous suit désormais.
        </p>
      </>
    );
  }

  if (n.type === "review_like") {
    const bookTitle = (n.payload.bookTitle as string) ?? "un livre";
    const likerName = (n.payload.likerName as string) ?? "Quelqu'un";
    return (
      <>
        <p className="text-sm font-medium text-foreground">Like sur votre review</p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{likerName}</span> a aimé votre review sur{" "}
          <span className="italic text-foreground">« {bookTitle} »</span>.
        </p>
      </>
    );
  }

  if (n.type === "review_comment") {
    const bookTitle = (n.payload.bookTitle as string) ?? "un livre";
    const commenterName = (n.payload.commenterName as string) ?? null;
    return (
      <>
        <p className="text-sm font-medium text-foreground">Nouveau commentaire</p>
        <p className="text-sm text-muted-foreground">
          {commenterName ? (
            <>
              <span className="font-medium text-foreground">{commenterName}</span> a commenté votre
              review sur{" "}
            </>
          ) : (
            <>Vous avez reçu un commentaire sur </>
          )}
          <span className="italic text-foreground">« {bookTitle} »</span>.
        </p>
      </>
    );
  }

  if (n.type === "recommendation") {
    const bookTitle = (n.payload.bookTitle as string) ?? "un livre";
    const recommenderName = n.payload.recommenderName as string | undefined;
    const isFromUser = Boolean(recommenderName);
    return (
      <>
        <p className="text-sm font-medium text-foreground">Nouvelle recommandation</p>
        <p className="text-sm text-muted-foreground">
          {isFromUser ? (
            <>
              <span className="font-medium text-foreground">{recommenderName}</span> vous recommande{" "}
              <span className="italic text-foreground">« {bookTitle} »</span>.
            </>
          ) : (
            <>
              <span className="italic text-foreground">« {bookTitle} »</span> pourrait vous plaire.
            </>
          )}
        </p>
      </>
    );
  }

  if (n.type === "awards_announcement") {
    const year = (n.payload.year as number) ?? null;
    return (
      <>
        <p className="text-sm font-medium text-foreground">
          BookMarkd Awards {year ?? ""}
        </p>
        <p className="text-sm text-muted-foreground">
          La cérémonie annuelle est publiée. Découvrez les meilleurs livres,
          lecteurs et critiques de l’année.
        </p>
      </>
    );
  }

  if (n.type === "awards_winner") {
    const year = (n.payload.year as number) ?? null;
    const category = (n.payload.category as string) ?? "";
    const rank = (n.payload.rank as number) ?? null;
    const label = AWARDS_CATEGORY_LABEL[category] ?? "Une catégorie";
    return (
      <>
        <p className="text-sm font-medium text-foreground">
          Bravo, vous êtes dans le palmarès !
        </p>
        <p className="text-sm text-muted-foreground">
          Vous êtes classé·e{rank ? ` #${rank}` : ""} dans la catégorie{" "}
          <span className="font-medium text-foreground">« {label} »</span>{" "}
          {year ? `de l’édition ${year}` : ""}.
        </p>
      </>
    );
  }

  if (n.type === "feedback_resolved") {
    const feedbackTitle = (n.payload.feedbackTitle as string) ?? "Votre feedback";
    return (
      <>
        <p className="text-sm font-medium text-foreground">Feedback résolu</p>
        <p className="text-sm text-muted-foreground">
          <span className="italic text-foreground">« {feedbackTitle} »</span> a été marqué comme
          résolu. Merci pour votre contribution.
        </p>
      </>
    );
  }

  return (
    <>
      <p className="text-sm font-medium text-foreground">Notification</p>
      <p className="text-sm text-muted-foreground">Une nouvelle activité a été enregistrée.</p>
    </>
  );
};

const getClickableUrl = (n: UiNotification): { href: string | null; label: string } => {
  if (n.type === "follow") {
    const followerId = (n.payload.followerId as string) ?? null;
    const followerUsername = (n.payload.followerUsername as string) ?? null;
    const followerName = (n.payload.followerName as string) ?? "l'utilisateur";
    return {
      href: followerId ? `/profiles/${followerUsername ?? followerId}` : null,
      label: `Voir le profil de ${followerName}`,
    };
  }
  if (n.type === "follow_request") {
    const requesterId = (n.payload.requesterId as string) ?? null;
    const requesterUsername = (n.payload.requesterUsername as string) ?? null;
    const requesterName = (n.payload.requesterName as string) ?? "l'utilisateur";
    return {
      href: requesterId ? `/profiles/${requesterUsername ?? requesterId}` : null,
      label: `Voir le profil de ${requesterName}`,
    };
  }
  if (n.type === "review_like" || n.type === "review_comment") {
    const bookTitle = (n.payload.bookTitle as string) ?? "";
    const bookAuthor = (n.payload.bookAuthor as string) ?? "";
    const reviewId = (n.payload.reviewId as string) ?? "";
    if (bookTitle && bookAuthor) {
      const slug = generateBookSlug(bookTitle, bookAuthor);
      return {
        href: reviewId ? `/books/${slug}#review-${reviewId}` : `/books/${slug}#reviews`,
        label: `Voir la review sur ${bookTitle}`,
      };
    }
    return { href: null, label: "" };
  }
  if (n.type === "recommendation") {
    const bookTitle = (n.payload.bookTitle as string) ?? "";
    const bookAuthor = (n.payload.bookAuthor as string) ?? "";
    const bookSlug = (n.payload.bookSlug as string) ?? "";
    if (bookSlug) return { href: `/books/${bookSlug}`, label: `Voir ${bookTitle}` };
    if (bookTitle && bookAuthor) {
      return {
        href: `/books/${generateBookSlug(bookTitle, bookAuthor)}`,
        label: `Voir ${bookTitle}`,
      };
    }
  }
  if (n.type === "awards_announcement" || n.type === "awards_winner") {
    const year = (n.payload.year as number) ?? null;
    if (year) {
      return { href: `/awards/${year}`, label: `Voir les Awards ${year}` };
    }
  }
  return { href: null, label: "" };
};

const NotificationsList = () => {
  const [notifications, setNotifications] = useState<UiNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<Filter>("all");
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

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.readAt).length,
    [notifications],
  );

  const filtered = useMemo(
    () => (filter === "unread" ? notifications.filter((n) => !n.readAt) : notifications),
    [filter, notifications],
  );

  const handleMarkAll = () => {
    startTransition(async () => {
      const result = await markAllAsRead();
      if (result.success) await load();
    });
  };

  const handleMark = (id: string) => {
    startTransition(async () => {
      const result = await markAsRead(id);
      if (result.success) await load();
    });
  };

  const handleAcceptFollowRequest = async (
    notificationId: string,
    requestId: string | null,
    requesterId: string | null,
  ) => {
    startTransition(async () => {
      setErrorMessages((prev) => {
        const next = { ...prev };
        delete next[notificationId];
        return next;
      });

      let finalRequestId = requestId;
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

  const handleRejectFollowRequest = async (
    notificationId: string,
    requestId: string | null,
    requesterId: string | null,
  ) => {
    startTransition(async () => {
      setErrorMessages((prev) => {
        const next = { ...prev };
        delete next[notificationId];
        return next;
      });

      let finalRequestId = requestId;
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
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card/50 p-4"
          >
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filtrer les notifications"
          className="inline-flex rounded-full border border-border/60 bg-card/50 p-1 text-sm"
        >
          <button
            role="tab"
            aria-selected={filter === "all"}
            onClick={() => setFilter("all")}
            className={`cursor-pointer rounded-full px-4 py-1.5 transition-colors ${
              filter === "all"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Toutes
            <span className="ml-1.5 text-xs opacity-70">{notifications.length}</span>
          </button>
          <button
            role="tab"
            aria-selected={filter === "unread"}
            onClick={() => setFilter("unread")}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 transition-colors ${
              filter === "unread"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Non lues
            {unreadCount > 0 ? (
              <span
                className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                  filter === "unread"
                    ? "bg-background/20 text-background"
                    : "bg-accent/30 text-accent-foreground"
                }`}
              >
                {unreadCount}
              </span>
            ) : null}
          </button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkAll}
          disabled={isPending || unreadCount === 0}
          aria-label="Tout marquer comme lu"
          className="gap-2 cursor-pointer disabled:opacity-40"
        >
          <Check className="h-4 w-4" />
          Tout marquer comme lu
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/60 bg-card/40 px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <p className="text-sm font-medium text-foreground">
            {filter === "unread" ? "Aucune notification non lue" : "Aucune notification"}
          </p>
          <p className="max-w-xs text-xs text-muted-foreground">
            {filter === "unread"
              ? "Vous êtes à jour. Revenez plus tard pour voir les nouvelles activités."
              : "Les likes, commentaires et demandes apparaîtront ici."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5" role="list">
          {filtered.map((n, index) => {
            const isAccepted = acceptedRequests[n.id];
            const isRejected = rejectedRequests[n.id];
            const isUnread = !n.readAt && !isAccepted;
            const showFollowRequestActions =
              n.type === "follow_request" && !n.readAt && !isAccepted && !isRejected;
            const { href, label } = getClickableUrl(n);
            const isClickable = href && !showFollowRequestActions && !isAccepted;
            const requesterId = (n.payload.requesterId as string) || null;

            const innerCard = (
              <div
                className={`relative flex items-start gap-4 overflow-hidden rounded-2xl border bg-card p-4 transition-all duration-200 ${
                  isUnread
                    ? "border-border/70 shadow-sm"
                    : "border-border/40 bg-card/40 hover:bg-card/70"
                } ${isClickable ? "hover:-translate-y-0.5 hover:shadow-md hover:border-border" : ""} focus-within:ring-2 focus-within:ring-ring/40`}
              >
                {isUnread ? (
                  <span
                    aria-hidden
                    className="absolute inset-y-3 left-0 w-1 rounded-full bg-accent"
                  />
                ) : null}

                <NotificationIcon type={n.type} />

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-0.5">{renderBody(n)}</div>
                    {isUnread ? (
                      <span
                        aria-label="Non lu"
                        title="Non lu"
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent"
                      />
                    ) : null}
                  </div>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatRelativeTimeFromNow(n.createdAt)}
                  </p>

                  {showFollowRequestActions ? (
                    <div className="mt-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const reqId = (n.payload.requestId as string) || null;
                            handleAcceptFollowRequest(n.id, reqId, requesterId);
                          }}
                          disabled={isPending}
                          aria-label="Accepter la demande"
                          className="gap-1.5 cursor-pointer"
                        >
                          <Check className="h-4 w-4" />
                          Accepter
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const reqId = (n.payload.requestId as string) || null;
                            handleRejectFollowRequest(n.id, reqId, requesterId);
                          }}
                          disabled={isPending}
                          aria-label="Refuser la demande"
                          className="gap-1.5 cursor-pointer hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                          Refuser
                        </Button>
                      </div>
                      {errorMessages[n.id] ? (
                        <p className="text-xs text-destructive">{errorMessages[n.id]}</p>
                      ) : null}
                    </div>
                  ) : isAccepted && n.type === "follow_request" ? (
                    <div className="mt-3 space-y-2">
                      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Demande acceptée
                      </p>
                      {requesterId ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFollowBack(requesterId, n.id);
                          }}
                          disabled={
                            isPending ||
                            followBackPending[requesterId] ||
                            followBackSent[requesterId]
                          }
                          aria-label={
                            followBackSent[requesterId]
                              ? "Demande de suivi envoyée"
                              : "Suivre en retour"
                          }
                          className="gap-1.5 cursor-pointer hover:text-foreground"
                        >
                          <UserPlus className="h-4 w-4" />
                          {followBackSent[requesterId] ? "Demande envoyée" : "Suivre en retour"}
                        </Button>
                      ) : null}
                      {errorMessages[n.id] ? (
                        <p className="text-xs text-destructive">{errorMessages[n.id]}</p>
                      ) : null}
                    </div>
                  ) : isUnread ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMark(n.id);
                      }}
                      disabled={isPending}
                      className="mt-1 cursor-pointer text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                    >
                      Marquer comme lu
                    </button>
                  ) : null}
                </div>
              </div>
            );

            const wrappedCard = isClickable ? (
              <Link
                href={href}
                aria-label={label}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 rounded-2xl"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest("button")) {
                    e.preventDefault();
                  }
                }}
              >
                {innerCard}
              </Link>
            ) : (
              innerCard
            );

            return (
              <li
                key={n.id}
                className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:slide-in-from-top-1"
                style={{ animationDelay: `${Math.min(index * 30, 240)}ms`, animationFillMode: "both" }}
              >
                {wrappedCard}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default NotificationsList;
