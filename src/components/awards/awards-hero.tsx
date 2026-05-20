import { Trophy } from "lucide-react";
import type { AwardsYearSummary } from "@/features/awards/types";

type Props = {
  year: number;
  theme: string | null;
  intro: string | null;
  summary: AwardsYearSummary;
  publishedAt: string | null;
};

export const AwardsHero = ({
  year,
  theme,
  intro,
  summary,
  publishedAt,
}: Props) => {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 px-6 py-10 backdrop-blur sm:px-10 sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, color-mix(in oklab, var(--accent) 35%, transparent), transparent 55%), radial-gradient(circle at 90% 90%, color-mix(in oklab, var(--chart-1) 25%, transparent), transparent 65%)",
        }}
      />
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-accent text-foreground">
            <Trophy className="size-5" aria-hidden />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            BookMarkd Awards · Édition {year}
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
            {theme ?? `Les Awards de ${year}`}
          </h1>
          {intro && (
            <p className="max-w-2xl text-base text-muted-foreground">{intro}</p>
          )}
          {!intro && (
            <p className="max-w-2xl text-base text-muted-foreground">
              Une année de lectures, de critiques et de ressentis. Voici les
              titres, les voix et les sentiments qui ont marqué la communauté
              BookMarkd.
            </p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Livres finis" value={summary.totalBooksFinished} />
          <Stat label="Lecteurs actifs" value={summary.totalUsersActive} />
          <Stat label="Reviews publiques" value={summary.totalReviewsPublished} />
          <Stat label="Ressentis partagés" value={summary.totalFeelings} />
          <Stat label="Nouveaux comptes" value={summary.totalNewcomers} />
        </dl>

        {publishedAt && (
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Publié le{" "}
            {new Date(publishedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>
    </section>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-xl border border-border/40 bg-background/70 px-3 py-3">
    <dt className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
      {label}
    </dt>
    <dd className="mt-1 text-xl font-semibold text-foreground">
      {value.toLocaleString("fr-FR")}
    </dd>
  </div>
);
