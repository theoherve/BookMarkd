import Image from "next/image";
import Link from "next/link";
import { Quote, Sparkles, Tag, User as UserIcon } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import type { AwardWinner } from "@/features/awards/types";

type Props = {
  winner: AwardWinner;
  emphasized?: boolean;
};

const rankAccent = (rank: number) => {
  if (rank === 1) return "bg-accent text-foreground";
  if (rank === 2 || rank === 3) return "bg-accent/30 text-foreground";
  return "bg-secondary text-secondary-foreground";
};

export const WinnerCard = ({ winner, emphasized = false }: Props) => {
  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border/60 bg-card/80 p-4 backdrop-blur transition-transform motion-safe:duration-300 hover:-translate-y-0.5",
        emphasized && "p-5 sm:p-6",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-semibold",
            rankAccent(winner.rank),
          )}
          aria-label={`Position ${winner.rank}`}
        >
          {winner.rank}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Score {winner.score.toFixed(2)}
        </span>
      </div>

      <WinnerBody winner={winner} emphasized={emphasized} />
    </article>
  );
};

const WinnerBody = ({ winner, emphasized }: { winner: AwardWinner; emphasized: boolean }) => {
  const s = winner.snapshot;
  switch (s.type) {
    case "book": {
      const href = s.slug ? `/books/${s.slug}` : null;
      const inner = (
        <div className="flex gap-3">
          <div
            className={cn(
              "relative shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border",
              emphasized ? "h-32 w-[5.5rem]" : "h-24 w-16",
            )}
          >
            {s.coverUrl ? (
              <Image
                src={s.coverUrl}
                alt=""
                fill
                sizes={emphasized ? "88px" : "64px"}
                className="object-cover transition-transform motion-safe:duration-300 group-hover:scale-105"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                —
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                "font-semibold text-foreground",
                emphasized ? "text-lg" : "text-sm",
              )}
            >
              {s.title}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{s.author}</p>
            <MetaPills metadata={winner.metadata} />
          </div>
        </div>
      );
      return href ? (
        <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md">
          {inner}
        </Link>
      ) : (
        inner
      );
    }
    case "user": {
      const href = s.username ? `/profiles/${s.username}` : null;
      const inner = (
        <div className="flex items-center gap-3">
          <span className="relative inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary ring-1 ring-border">
            {s.avatarUrl ? (
              <Image
                src={s.avatarUrl}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="text-xs font-semibold text-secondary-foreground">
                {getInitials(s.displayName)}
              </span>
            )}
            <UserIcon className="absolute -bottom-1 -right-1 size-3 rounded-full bg-card p-0.5 text-muted-foreground" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className={cn("font-semibold text-foreground", emphasized ? "text-lg" : "text-sm")}>
              {s.displayName}
            </h3>
            {s.username && (
              <p className="text-xs text-muted-foreground">@{s.username}</p>
            )}
            <MetaPills metadata={winner.metadata} />
          </div>
        </div>
      );
      return href ? (
        <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md">
          {inner}
        </Link>
      ) : (
        inner
      );
    }
    case "tag": {
      return (
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-chart-1/15 text-chart-1">
            <Tag className="size-[18px]" aria-hidden />
          </span>
          <div>
            <h3 className={cn("font-semibold text-foreground", emphasized ? "text-lg" : "text-sm")}>
              {s.name}
            </h3>
            <MetaPills metadata={winner.metadata} />
          </div>
        </div>
      );
    }
    case "review": {
      const href = s.bookSlug ? `/books/${s.bookSlug}` : null;
      const body = (
        <div className="flex gap-3">
          <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
            {s.bookCoverUrl ? (
              <Image
                src={s.bookCoverUrl}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
                unoptimized
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <Quote className="size-4 text-accent" aria-hidden />
            <p className="mt-1 text-sm text-foreground line-clamp-3">
              {s.excerpt}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              — {s.authorDisplayName} · {s.bookTitle}
            </p>
          </div>
        </div>
      );
      return href ? (
        <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md">
          {body}
        </Link>
      ) : (
        body
      );
    }
    case "feeling_book": {
      const href = s.bookSlug ? `/books/${s.bookSlug}` : null;
      const body = (
        <div className="flex gap-3">
          <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
            {s.bookCoverUrl ? (
              <Image
                src={s.bookCoverUrl}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
                unoptimized
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
              <Sparkles className="size-3" aria-hidden /> {s.feelingLabel}
            </span>
            <h3 className={cn("mt-1 font-semibold text-foreground", emphasized ? "text-lg" : "text-sm")}>
              {s.bookTitle}
            </h3>
            <p className="text-xs text-muted-foreground">{s.bookAuthor}</p>
          </div>
        </div>
      );
      return href ? (
        <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md">
          {body}
        </Link>
      ) : (
        body
      );
    }
    default:
      return null;
  }
};

const MetaPills = ({ metadata }: { metadata: Record<string, unknown> }) => {
  const entries = Object.entries(metadata).filter(([key, value]) => {
    if (value == null) return false;
    if (typeof value === "number" || typeof value === "string") {
      return !["authorId", "bookId", "keywordId", "joinedAt"].includes(key);
    }
    return false;
  });
  if (entries.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {entries.slice(0, 3).map(([key, value]) => (
        <span
          key={key}
          className="rounded-full bg-secondary/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-secondary-foreground"
        >
          {humanize(key)} {String(value)}
        </span>
      ))}
    </div>
  );
};

const HUMAN: Record<string, string> = {
  finishCount: "lectures",
  avgRating: "note moy.",
  ratingCount: "votes",
  reviewsWritten: "reviews",
  listsCreated: "listes",
  reviewCount: "reviews",
  likesReceived: "likes",
  likeCount: "likes",
  wishlistCount: "wishlists",
  uniqueReaders: "lecteurs",
  uniqueUsers: "voix",
};

const humanize = (key: string) => HUMAN[key] ?? key;
