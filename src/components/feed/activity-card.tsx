import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatRelativeTimeFromNow } from "@/lib/datetime";
import { formatRating } from "@/lib/utils";
import { generateBookSlug } from "@/lib/slug";
import type { FeedActivity } from "@/features/feed/types";

type ActivityCardProps = {
  item: FeedActivity;
};

const TITLE_MAX_LENGTH = 50;

const truncateTitle = (title: string | null | undefined, maxLength = TITLE_MAX_LENGTH): string => {
  if (!title) return "Nouvelle activité";
  return title.length > maxLength ? `${title.slice(0, maxLength).trim()}...` : title;
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

  const bookHref =
    item.bookId
      ? `/books/${item.bookId}`
      : item.bookTitle && item.bookAuthor
        ? `/books/${generateBookSlug(item.bookTitle, item.bookAuthor)}`
        : null;

  const isTitleTruncated =
    item.bookTitle != null && item.bookTitle.length > TITLE_MAX_LENGTH;

  const actionLabel = item.combinedAction ?? actionLabels[item.type];

  const card = (
    <Card
      role="article"
      tabIndex={bookHref ? 0 : undefined}
      aria-label={`${item.userName} ${actionLabel} ${item.bookTitle ?? "contenu"}`}
      className="flex h-full w-full flex-col transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent"
    >
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">
            {item.userName}{" "}
            <span className="font-normal text-muted-foreground">
              {actionLabel}
            </span>
          </p>
          <CardDescription className="text-xs text-muted-foreground">
            {occurredAtLabel}
          </CardDescription>
        </div>
        <CardTitle className="text-base font-semibold text-foreground">
          {truncateTitle(item.bookTitle)}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col space-y-3 overflow-y-auto">
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
            {item.userName} {actionLabel}{" "}
            {item.bookTitle ? truncateTitle(item.bookTitle) : "ce contenu"}.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );

  const cardContent = isTitleTruncated ? (
    <Tooltip>
      <TooltipTrigger asChild>{card}</TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        className="max-w-sm border border-border bg-popover text-popover-foreground text-center shadow-md"
      >
        {item.bookTitle}
      </TooltipContent>
    </Tooltip>
  ) : (
    card
  );

  if (bookHref) {
    return (
      <Link
        href={bookHref}
        className="block h-full w-full min-w-0"
        aria-label={`Voir la fiche du livre ${item.bookTitle ?? ""}`}
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default ActivityCard;

