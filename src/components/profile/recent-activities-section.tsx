"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTimeFromNow } from "@/lib/datetime";
import { formatRating } from "@/lib/utils";
import type { RecentActivity } from "@/features/profile/types";

type RecentActivitiesSectionProps = {
  activities: RecentActivity[];
};

const actionLabels: Record<RecentActivity["type"], string> = {
  rating: "avez noté",
  review: "avez publié une critique",
  status_change: "avez mis à jour votre statut",
  readlist_add: "avez ajouté à votre read list",
  review_comment: "avez commenté",
  list_create: "avez créé une liste",
  list_item_add: "avez ajouté à une liste",
  review_like: "avez aimé une critique",
  follow: "avez suivi",
  top_book_update: "avez mis à jour votre top 3",
};

const RecentActivitiesSection = ({ activities }: RecentActivitiesSectionProps) => {
  const [displayedCount, setDisplayedCount] = useState(3);
  const INITIAL_COUNT = 3;
  const INCREMENT_COUNT = 5;

  if (activities.length === 0) {
    return (
      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            Activités récentes
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Vos dernières actions sur BookMarkd.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucune activité récente.
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayedActivities = activities.slice(0, displayedCount);
  const hasMore = displayedCount < activities.length;
  const showLessButton = displayedCount > INITIAL_COUNT;

  const handleLoadMore = () => {
    setDisplayedCount((prev) => Math.min(prev + INCREMENT_COUNT, activities.length));
  };

  const handleShowLess = () => {
    setDisplayedCount(INITIAL_COUNT);
  };

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">
          Activités récentes
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Vos dernières actions sur BookMarkd.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayedActivities.map((activity) => {
          const occurredAtLabel = formatRelativeTimeFromNow(activity.occurredAt);
          const ratingStars =
            typeof activity.rating === "number" && activity.rating > 0
              ? `${"★".repeat(Math.round(activity.rating))}${"☆".repeat(
                  5 - Math.round(activity.rating),
                )}`
              : null;

          const actionTargets: string[] = [];
          if (activity.bookTitle) {
            actionTargets.push(activity.bookTitle);
          }
          if (activity.listTitle) {
            actionTargets.push(activity.listTitle);
          }
          if (activity.type === "follow" && activity.note) {
            actionTargets.push(activity.note);
          }
          const actionLine = `${actionLabels[activity.type]}${
            actionTargets.length ? ` ${actionTargets.join(" ")}` : ""
          }`;
          const noteContent =
            activity.note && activity.type === "review"
              ? `"${activity.note}"`
              : activity.note;

          const ActivityCardContent = (
            <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-background/60 p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-semibold text-foreground">Vous</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {occurredAtLabel}
                </span>
              </div>
              <p className="text-base text-muted-foreground line-clamp-2">
                {actionLine}
              </p>
              {activity.note && activity.type !== "follow" ? (
                <p className="text-base text-muted-foreground line-clamp-2">
                  {noteContent}
                </p>
              ) : null}
              {activity.status ? (
                <Badge
                  variant="outline"
                  className="w-fit text-xs"
                  aria-label={`Statut: ${
                    activity.status === "to_read"
                      ? "À lire"
                      : activity.status === "reading"
                        ? "En cours"
                        : "Terminé"
                  }`}
                >
                  {activity.status === "to_read"
                    ? "À lire"
                    : activity.status === "reading"
                      ? "En cours"
                      : "Terminé"}
                </Badge>
              ) : null}
              {typeof activity.rating === "number" && activity.rating > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    aria-label={`Note ${formatRating(activity.rating)} sur 5`}
                    className="rounded-full px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {formatRating(activity.rating)}/5
                  </Badge>
                  <span
                    aria-hidden="true"
                    className="text-xs font-medium tracking-widest text-accent-foreground"
                  >
                    {ratingStars}
                  </span>
                </div>
              ) : null}
            </div>
          );

          // Si l'activité a un bookSlug, rendre la carte cliquable
          const bookHref = activity.bookSlug ? `/books/${activity.bookSlug}` : null;
          
          // Si l'activité est de type "follow", rendre la carte cliquable vers le profil
          const profileHref = activity.type === "follow" && activity.followedUserId
            ? activity.followedUserUsername
              ? `/profiles/${activity.followedUserUsername}`
              : `/profiles/${activity.followedUserId}`
            : null;
          
          if (bookHref) {
            return (
              <Link
                key={activity.id}
                href={bookHref}
                className="block transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
                aria-label={`Voir le livre ${activity.bookTitle}`}
              >
                {ActivityCardContent}
              </Link>
            );
          }
          
          if (profileHref) {
            return (
              <Link
                key={activity.id}
                href={profileHref}
                className="block transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
                aria-label={`Voir le profil de ${activity.note ?? "l'utilisateur"}`}
              >
                {ActivityCardContent}
              </Link>
            );
          }

          // Sinon, rendre la carte normale (non cliquable)
          return (
            <div key={activity.id}>
              {ActivityCardContent}
            </div>
          );
        })}
        {(hasMore || showLessButton) && (
          <div className="flex justify-center pt-2">
            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                aria-label="Charger plus d'activités"
              >
                Voir plus ({activities.length - displayedCount} restantes)
              </Button>
            )}
            {showLessButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowLess}
                aria-label="Afficher moins d'activités"
                className="ml-2"
              >
                Voir moins
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivitiesSection;

