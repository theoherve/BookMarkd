"use client";

import { AwardsSlideBase } from "./awards-slide-base";
import type { AwardsYearSummary } from "@/features/awards/types";

type Props = {
  year: number;
  summary: AwardsYearSummary;
};

export const AwardsSummarySlide = ({ year, summary }: Props) => {
  const stats: { label: string; value: number }[] = [
    { label: "Livres finis", value: summary.totalBooksFinished },
    { label: "Lecteurs actifs", value: summary.totalUsersActive },
    { label: "Reviews publiques", value: summary.totalReviewsPublished },
    { label: "Ressentis partagés", value: summary.totalFeelings },
    { label: "Nouveaux comptes", value: summary.totalNewcomers },
  ];

  return (
    <AwardsSlideBase>
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Une année en chiffres
      </p>
      <h2 className="text-4xl font-semibold text-foreground">{year} en bref</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border/40 bg-background/60 px-3 py-4 backdrop-blur"
          >
            <p className="text-2xl font-semibold text-foreground sm:text-3xl">
              {s.value.toLocaleString("fr-FR")}
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </AwardsSlideBase>
  );
};
