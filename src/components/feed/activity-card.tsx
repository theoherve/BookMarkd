import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  ListPlus,
  MessageSquare,
  Star,
  StarHalf,
  UserPlus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatRelativeTimeFromNow } from "@/lib/datetime";
import { generateBookSlug } from "@/lib/slug";
import { cn, formatRating, getInitials } from "@/lib/utils";
import type { FeedActivity } from "@/features/feed/types";

type ActivityCardProps = {
  item: FeedActivity;
};

const TITLE_MAX_LENGTH = 50;

const truncateTitle = (
  title: string | null | undefined,
  maxLength = TITLE_MAX_LENGTH,
): string => {
  if (!title) return "Nouvelle activité";
  return title.length > maxLength
    ? `${title.slice(0, maxLength).trim()}...`
    : title;
};

const actionLabels: Record<FeedActivity["type"], string> = {
  rating: "a noté",
  review: "a publié une critique",
  status_change: "a mis à jour son statut",
  list_update: "a mis à jour une liste",
  follow: "a suivi un profil",
};

type TypeMeta = {
  icon: typeof Star;
  label: string;
  iconClass: string;
  pillClass: string;
  accentClass: string;
};

const typeMeta: Record<FeedActivity["type"], TypeMeta> = {
  rating: {
    icon: Star,
    label: "Note",
    iconClass: "text-yellow-600 dark:text-yellow-400",
    pillClass:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300",
    accentClass: "bg-yellow-400/70 dark:bg-yellow-400/60",
  },
  review: {
    icon: MessageSquare,
    label: "Critique",
    iconClass: "text-accent-foreground",
    pillClass: "bg-accent/40 text-accent-foreground",
    accentClass: "bg-accent",
  },
  status_change: {
    icon: BookOpen,
    label: "Statut",
    iconClass: "text-foreground/80",
    pillClass: "bg-secondary text-secondary-foreground",
    accentClass: "bg-primary/60 dark:bg-primary/70",
  },
  list_update: {
    icon: ListPlus,
    label: "Liste",
    iconClass: "text-chart-2",
    pillClass: "bg-chart-2/15 text-chart-2",
    accentClass: "bg-chart-2/70",
  },
  follow: {
    icon: UserPlus,
    label: "Abonnement",
    iconClass: "text-chart-3",
    pillClass: "bg-chart-3/15 text-chart-3",
    accentClass: "bg-chart-3/70",
  },
};

const AvatarBubble = ({
  name,
  url,
}: {
  name: string;
  url?: string | null;
}) => {
  if (url) {
    return (
      <Image
        src={url}
        alt=""
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-full object-cover ring-2 ring-border"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground ring-2 ring-border"
    >
      {getInitials(name)}
    </span>
  );
};

const RatingStars = ({ rating }: { rating: number }) => {
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: full }, (_, i) => (
        <Star
          key={`full-${i}`}
          className="size-3.5 fill-yellow-500 text-yellow-500"
        />
      ))}
      {hasHalf && (
        <span className="relative inline-block size-3.5">
          <Star className="absolute inset-0 size-3.5 text-yellow-500" />
          <StarHalf className="absolute inset-0 size-3.5 fill-yellow-500 text-yellow-500" />
        </span>
      )}
      {Array.from({ length: empty }, (_, i) => (
        <Star key={`empty-${i}`} className="size-3.5 text-yellow-500/40" />
      ))}
    </span>
  );
};

const ActivityCard = ({ item }: ActivityCardProps) => {
  const occurredAtLabel = formatRelativeTimeFromNow(item.occurredAt);
  const actionLabel = item.combinedAction ?? actionLabels[item.type];
  const meta = typeMeta[item.type];
  const Icon = meta.icon;

  const bookHref = item.bookId
    ? `/books/${item.bookId}`
    : item.bookTitle && item.bookAuthor
      ? `/books/${generateBookSlug(item.bookTitle, item.bookAuthor)}`
      : null;

  const isTitleTruncated =
    item.bookTitle != null && item.bookTitle.length > TITLE_MAX_LENGTH;
  const hasRating = typeof item.rating === "number" && item.rating > 0;

  const card = (
    <Card
      role="article"
      tabIndex={bookHref ? 0 : undefined}
      aria-label={`${item.userName} ${actionLabel} ${item.bookTitle ?? "contenu"}`}
      className="group relative flex h-full w-full flex-col overflow-hidden border-border/60 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-[3px]", meta.accentClass)}
      />
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-start gap-3">
          <AvatarBubble name={item.userName} url={item.userAvatarUrl} />
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate text-sm font-semibold text-foreground">
              {item.userName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {occurredAtLabel}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              meta.pillClass,
            )}
          >
            <Icon className={cn("size-3", meta.iconClass)} aria-hidden />
            {meta.label}
          </span>
        </header>

        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground/90">{actionLabel}</span>
          {item.bookTitle ? (
            <>
              {" "}
              <span className="font-semibold text-foreground">
                « {truncateTitle(item.bookTitle)} »
              </span>
            </>
          ) : null}
        </p>

        {hasRating ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              aria-label={`Note ${formatRating(item.rating!)} sur 5`}
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            >
              {formatRating(item.rating!)}/5
            </Badge>
            <RatingStars rating={item.rating!} />
          </div>
        ) : null}

        {item.note ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            “{item.note}”
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
        className="max-w-sm border border-border bg-popover text-center text-popover-foreground shadow-md"
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
        className="block h-full w-full min-w-0 rounded-xl focus-visible:outline-none"
        aria-label={`Voir la fiche du livre ${item.bookTitle ?? ""}`}
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default ActivityCard;
