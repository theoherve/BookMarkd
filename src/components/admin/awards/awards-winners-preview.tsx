"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteWinner } from "@/server/actions/admin/awards";
import type { AwardCategory, AwardWinner } from "@/features/awards/types";

const CATEGORY_LABEL: Record<AwardCategory, string> = {
  book_of_the_year: "Livre de l’année",
  reader_of_the_year: "Lecteur de l’année",
  top_categories: "Catégories phares",
  top_reviewer: "Critique de l’année",
  most_loved_review: "Critique la plus aimée",
  trending_wishlist: "Livre le plus convoité",
  best_newcomer: "Révélation de l’année",
  feeling_award: "Sentiment de l’année",
};

type Props = {
  grouped: Record<AwardCategory, AwardWinner[]>;
};

export const AwardsWinnersPreview = ({ grouped }: Props) => {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">Gagnants par catégorie</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        {(Object.keys(grouped) as AwardCategory[]).map((category) => (
          <CategoryBlock
            key={category}
            category={category}
            winners={grouped[category]}
          />
        ))}
      </div>
    </section>
  );
};

const CategoryBlock = ({
  category,
  winners,
}: {
  category: AwardCategory;
  winners: AwardWinner[];
}) => {
  return (
    <div className="rounded-xl border border-border/60 bg-card/80 p-5 backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{CATEGORY_LABEL[category]}</h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {winners.length} gagnant·e·s
        </span>
      </div>
      {winners.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun gagnant calculé pour cette catégorie.
        </p>
      ) : (
        <ol className="space-y-2">
          {winners.map((w) => (
            <WinnerRow key={w.id} winner={w} />
          ))}
        </ol>
      )}
    </div>
  );
};

const formatSnapshot = (winner: AwardWinner): string => {
  const s = winner.snapshot;
  switch (s.type) {
    case "book":
      return `${s.title} — ${s.author}`;
    case "user":
      return s.displayName;
    case "tag":
      return s.name;
    case "review":
      return `${s.bookTitle} · « ${s.excerpt.slice(0, 80)}${s.excerpt.length > 80 ? "…" : ""} »`;
    case "feeling_book":
      return `${s.feelingLabel} · ${s.bookTitle}`;
    default:
      return "—";
  }
};

const WinnerRow = ({ winner }: { winner: AwardWinner }) => {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onDelete = () => {
    if (!window.confirm("Supprimer ce gagnant ?")) return;
    startTransition(async () => {
      const result = await deleteWinner(winner.id);
      if (!result.success) window.alert(result.message);
      else router.refresh();
    });
  };

  return (
    <li className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-background/50 px-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <Badge variant="outline" className="font-mono">
          #{winner.rank}
        </Badge>
        <span className="truncate text-sm">{formatSnapshot(winner)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          score {winner.score.toFixed(2)}
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onDelete}
          disabled={pending}
          aria-label="Supprimer"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  );
};
