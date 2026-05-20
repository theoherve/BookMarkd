"use client";

import { AwardsSlideBase } from "./awards-slide-base";
import { WinnerCard } from "../winner-card";
import { CATEGORY_LABELS } from "../category-labels";
import type { AwardCategory, AwardWinner } from "@/features/awards/types";

type Props = {
  category: AwardCategory;
  winners: AwardWinner[];
  spotlight?: boolean;
};

export const AwardsCategorySlide = ({
  category,
  winners,
  spotlight = false,
}: Props) => {
  const labels = CATEGORY_LABELS[category];

  if (winners.length === 0) {
    return (
      <AwardsSlideBase>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {labels.kicker}
        </p>
        <h2 className="text-4xl font-semibold text-foreground">
          {labels.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          Pas de gagnant calculé cette année.
        </p>
      </AwardsSlideBase>
    );
  }

  if (spotlight) {
    const [first, ...rest] = winners;
    return (
      <AwardsSlideBase>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
          {labels.kicker}
        </p>
        <h2 className="text-4xl font-semibold text-foreground sm:text-5xl">
          {labels.title}
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
          {labels.subtitle}
        </p>
        <div className="grid gap-4 text-left lg:grid-cols-[1.4fr_1fr]">
          <WinnerCard winner={first} emphasized />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {rest.map((w) => (
              <WinnerCard key={w.id} winner={w} />
            ))}
          </div>
        </div>
      </AwardsSlideBase>
    );
  }

  return (
    <AwardsSlideBase>
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {labels.kicker}
      </p>
      <h2 className="text-4xl font-semibold text-foreground">{labels.title}</h2>
      <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
        {labels.subtitle}
      </p>
      <div className="grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
        {winners.map((w) => (
          <WinnerCard key={w.id} winner={w} />
        ))}
      </div>
    </AwardsSlideBase>
  );
};
