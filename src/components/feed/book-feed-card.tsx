"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bookmark,
  BookOpen,
  CheckCircle2,
  Users,
  XCircle,
} from "lucide-react";

import AddToReadlistButton from "@/components/search/add-to-readlist-button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatRelativeTimeFromNow } from "@/lib/datetime";
import { generateBookSlug } from "@/lib/slug";
import { cn, formatRating, getInitials } from "@/lib/utils";
import type { FeedFriendBook } from "@/features/feed/types";

type BookFeedCardProps = {
  item: FeedFriendBook;
};

type StatusMeta = {
  label: string;
  icon: typeof BookOpen;
  pillClass: string;
  accentClass: string;
};

const statusMeta: Record<FeedFriendBook["status"], StatusMeta> = {
  reading: {
    label: "Lit",
    icon: BookOpen,
    pillClass: "bg-accent/30 text-accent-foreground",
    accentClass: "bg-accent",
  },
  finished: {
    label: "Terminé",
    icon: CheckCircle2,
    pillClass: "bg-chart-2/15 text-chart-2",
    accentClass: "bg-chart-2/70",
  },
  to_read: {
    label: "À lire",
    icon: Bookmark,
    pillClass: "bg-secondary text-secondary-foreground",
    accentClass: "bg-primary/60 dark:bg-primary/70",
  },
  dnf: {
    label: "Abandonné",
    icon: XCircle,
    pillClass: "bg-muted text-muted-foreground",
    accentClass: "bg-muted-foreground/40",
  },
};

const BookFeedCard = ({ item }: BookFeedCardProps) => {
  const updatedAtLabel = formatRelativeTimeFromNow(item.updatedAt);
  const bookSlug = generateBookSlug(item.title, item.author);
  const detailHref = `/books/${bookSlug}`;
  const meta = statusMeta[item.status];
  const StatusIcon = meta.icon;
  const hasRating = typeof item.averageRating === "number" && item.averageRating > 0;

  return (
    <Card
      role="article"
      aria-label={`${item.readerName} — ${meta.label} — ${item.title}`}
      className="group relative flex h-full w-full flex-col gap-3 overflow-hidden border-border/60 bg-card p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-lg focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2"
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-[3px]", meta.accentClass)}
      />

      <Link
        href={detailHref}
        aria-label={`Voir la fiche de ${item.title}`}
        className="flex gap-3 focus-visible:outline-none"
      >
        <div className="relative h-[88px] w-16 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
          {item.coverUrl ? (
            <Image
              src={item.coverUrl}
              alt=""
              fill
              sizes="64px"
              className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
              unoptimized
            />
          ) : (
            <span
              aria-hidden
              className="flex h-full w-full items-center justify-center text-muted-foreground"
            >
              <BookOpen className="size-5" />
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span
            className={cn(
              "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              meta.pillClass,
            )}
          >
            <StatusIcon className="size-3" aria-hidden />
            {meta.label}
          </span>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {item.title}
          </h3>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {item.author}
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 py-0.5 pl-0.5 pr-2 transition hover:bg-muted">
              <span className="relative inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary ring-1 ring-border">
                {item.readerAvatarUrl ? (
                  <Image
                    src={item.readerAvatarUrl}
                    alt=""
                    fill
                    sizes="20px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-[8px] font-semibold text-secondary-foreground">
                    {getInitials(item.readerName)}
                  </span>
                )}
              </span>
              <span className="truncate text-[11px] font-medium text-foreground">
                {item.readerName}
              </span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            {`${item.readerName} · ${updatedAtLabel}`}
          </TooltipContent>
        </Tooltip>
        {hasRating ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                aria-label={`Note moyenne communauté ${formatRating(item.averageRating!)} sur 5`}
              >
                <Users className="size-2.5" aria-hidden />
                {formatRating(item.averageRating!)}/5
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              Note moyenne de la communauté
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <div className="mt-auto pt-1">
        <AddToReadlistButton bookId={item.bookId} compact />
      </div>
    </Card>
  );
};

export default BookFeedCard;
