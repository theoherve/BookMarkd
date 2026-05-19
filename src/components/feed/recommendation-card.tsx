import Image from "next/image";
import Link from "next/link";
import { BookOpen, Sparkles, Users } from "lucide-react";

import AddToReadlistButton from "@/components/search/add-to-readlist-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { generateBookSlug } from "@/lib/slug";
import { cn, getInitials } from "@/lib/utils";
import type { FeedRecommendation } from "@/features/feed/types";

type RecommendationCardProps = {
  item: FeedRecommendation;
};

const sourceMeta: Record<
  FeedRecommendation["source"],
  { label: string; tooltip: string; icon: typeof Sparkles; tone: string }
> = {
  friends: {
    label: "Vos amis",
    tooltip: "Calcul basé sur vos amis et leurs activités récentes.",
    icon: Users,
    tone: "bg-chart-3/15 text-chart-3",
  },
  global: {
    label: "Tendances",
    tooltip: "Titres les plus populaires sur BookMarkd cette semaine.",
    icon: Sparkles,
    tone: "bg-accent/30 text-accent-foreground",
  },
  similar: {
    label: "Vos goûts",
    tooltip:
      "Score combinant tags en commun (50%), notes de vos amis (30%) et popularité (20%).",
    icon: BookOpen,
    tone: "bg-chart-2/15 text-chart-2",
  },
};

const RecommendationCard = ({ item }: RecommendationCardProps) => {
  const bookSlug = generateBookSlug(item.title, item.author);
  const bookHref = `/books/${bookSlug}`;
  const meta = sourceMeta[item.source];
  const SourceIcon = meta.icon;

  const reason = item.reason ?? meta.tooltip;
  const scoreLabel =
    item.scoreLabel !== ""
      ? item.scoreLabel ??
        (item.score > 0 ? `Affinité ${item.score}%` : null)
      : null;

  const readers = item.readers?.slice(0, 4) ?? [];
  const tags = item.tags?.slice(0, 3) ?? [];

  return (
    <Card
      role="article"
      aria-label={`Recommandation ${item.title}`}
      className="group relative flex h-full w-full flex-col gap-3 overflow-hidden border-border/60 bg-card p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-lg focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2"
    >
      <Link
        href={bookHref}
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
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  meta.tone,
                )}
              >
                <SourceIcon className="size-3" aria-hidden />
                {meta.label}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {meta.tooltip}
            </TooltipContent>
          </Tooltip>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {item.title}
          </h3>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {item.author}
          </p>
        </div>
      </Link>

      {reason ? (
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {reason}
        </p>
      ) : null}

      {(scoreLabel || tags.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {scoreLabel && (
            <Badge
              variant="secondary"
              className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground dark:text-foreground"
              aria-label={scoreLabel}
            >
              {scoreLabel}
            </Badge>
          )}
          {tags.map((tag) => (
            <Badge
              key={`${item.id}-${tag}`}
              variant="outline"
              className="rounded-full px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {readers.length > 0 ? (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {readers.map((reader) => (
              <Tooltip key={reader.id}>
                <TooltipTrigger asChild>
                  <Link
                    href={
                      reader.username
                        ? `/profiles/${reader.username}`
                        : `/profiles/${reader.id}`
                    }
                    aria-label={`Voir le profil de ${reader.displayName}`}
                    className="relative inline-flex size-6 items-center justify-center overflow-hidden rounded-full bg-secondary ring-2 ring-card transition-transform hover:scale-110 hover:z-10"
                  >
                    {reader.avatarUrl ? (
                      <Image
                        src={reader.avatarUrl}
                        alt=""
                        fill
                        sizes="24px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-[9px] font-semibold text-secondary-foreground">
                        {getInitials(reader.displayName)}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {reader.displayName}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          {item.friendCount && item.friendCount > readers.length ? (
            <span className="text-[10px] text-muted-foreground">
              +{item.friendCount - readers.length}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              {readers.length === 1 ? "1 lecteur" : `${readers.length} lecteurs`}
            </span>
          )}
        </div>
      ) : null}

      <div className="mt-auto pt-1">
        <AddToReadlistButton
          bookId={item.bookId}
          disabled={item.viewerHasInReadlist}
          compact
        />
      </div>
    </Card>
  );
};

export default RecommendationCard;
