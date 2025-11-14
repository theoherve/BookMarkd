import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRelativeTimeFromNow } from "@/lib/datetime";
import { formatRating } from "@/lib/utils";
import type { FeedActivity } from "@/features/feed/types";

type ActivityCardProps = {
  item: FeedActivity;
};

const actionLabels: Record<FeedActivity["type"], string> = {
  rating: "a noté",
  review: "a publié une critique",
  status_change: "a mis à jour son statut",
  list_update: "a mis à jour une liste",
  follow: "a suivi un profil",
};

const ActivityCard = ({ item }: ActivityCardProps) => {
  const ratingStars =
    typeof item.rating === "number" && item.rating > 0
      ? `${"★".repeat(Math.round(item.rating))}${"☆".repeat(
          5 - Math.round(item.rating),
        )}`
      : null;

  const occurredAtLabel = formatRelativeTimeFromNow(item.occurredAt);
  // Pour les activités, on n'a pas toujours l'auteur, donc on ne peut pas générer le slug
  // On rendra juste le titre cliquable si on a un bookId dans le payload (à implémenter plus tard)

  return (
    <Card
      role="article"
      tabIndex={0}
      aria-label={`${item.userName} ${actionLabels[item.type]} ${item.bookTitle ?? "contenu"}`}
      className="transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent"
    >
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">
            {item.userName}{" "}
            <span className="font-normal text-muted-foreground">
              {actionLabels[item.type]}
            </span>
          </p>
          <CardDescription className="text-xs text-muted-foreground">
            {occurredAtLabel}
          </CardDescription>
        </div>
        <CardTitle className="text-base font-semibold text-foreground">
          {item.bookTitle ?? "Nouvelle activité"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {typeof item.rating === "number" && item.rating > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge
              variant="secondary"
              aria-label={`Note ${formatRating(item.rating)} sur 5`}
              className="rounded-full px-3 py-1 text-muted-foreground"
            >
              {formatRating(item.rating)}/5
            </Badge>
            <span
              aria-hidden="true"
              className="font-medium tracking-widest text-accent-foreground"
            >
              {ratingStars}
            </span>
          </div>
        ) : null}
        {item.note ? (
          <p className="text-sm text-muted-foreground">{item.note}</p>
        ) : null}
        {!item.note && typeof item.rating !== "number" ? (
          <p className="text-sm text-muted-foreground">
            {item.userName} {actionLabels[item.type]}{" "}
            {item.bookTitle ?? "ce contenu"}.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default ActivityCard;

