import Link from "next/link";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS } from "./category-labels";
import type { UserAwardBadge } from "@/features/awards/server/get-user-badges";

type Props = {
  badges: UserAwardBadge[];
};

const rankClass = (rank: number) => {
  if (rank === 1)
    return "bg-accent text-foreground border-accent";
  if (rank === 2 || rank === 3)
    return "bg-accent/25 text-foreground border-accent/40";
  return "bg-background/70 text-foreground border-border";
};

export const UserAwardBadges = ({ badges }: Props) => {
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {badges.slice(0, 6).map((b) => {
        const labels = CATEGORY_LABELS[b.category];
        return (
          <Link
            key={`${b.year}-${b.category}-${b.rank}`}
            href={`/awards/${b.year}`}
            title={`${labels.title} · #${b.rank} · ${b.year}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors hover:bg-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              rankClass(b.rank),
            )}
          >
            <Trophy className="size-3" aria-hidden />
            <span>{labels.title}</span>
            <span aria-hidden>·</span>
            <span>{b.year}</span>
            {b.rank > 1 && (
              <>
                <span aria-hidden>·</span>
                <span>#{b.rank}</span>
              </>
            )}
          </Link>
        );
      })}
    </div>
  );
};
