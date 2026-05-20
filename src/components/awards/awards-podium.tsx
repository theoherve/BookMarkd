import { WinnerCard } from "./winner-card";
import { CATEGORY_LABELS } from "./category-labels";
import type { AwardCategory, AwardWinner } from "@/features/awards/types";

type Props = {
  category: AwardCategory;
  winners: AwardWinner[];
  variant?: "spotlight" | "regular";
};

export const AwardsPodium = ({
  category,
  winners,
  variant = "regular",
}: Props) => {
  if (winners.length === 0) return null;
  const labels = CATEGORY_LABELS[category];

  if (variant === "spotlight") {
    const [first, ...rest] = winners;
    return (
      <section className="space-y-6">
        <header className="space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
            {labels.kicker}
          </span>
          <h2 className="text-3xl font-semibold text-foreground">
            {labels.title}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {labels.subtitle}
          </p>
        </header>
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <WinnerCard winner={first} emphasized />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {rest.map((w) => (
              <WinnerCard key={w.id} winner={w} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {labels.kicker}
        </span>
        <h2 className="text-2xl font-semibold text-foreground">
          {labels.title}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {labels.subtitle}
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {winners.map((w) => (
          <WinnerCard key={w.id} winner={w} />
        ))}
      </div>
    </section>
  );
};
