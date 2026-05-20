import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { getPublishedYears } from "@/features/awards/server/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "BookMarkd Awards",
  description:
    "Les cérémonies annuelles BookMarkd : meilleurs livres, lecteurs, critiques et ressentis de chaque année.",
};

const AwardsIndexPage = async () => {
  const years = await getPublishedYears();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-12 md:py-16">
      <header className="space-y-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          BookMarkd Awards
        </span>
        <h1 className="text-4xl font-semibold text-foreground">
          Les cérémonies annuelles
        </h1>
        <p className="text-base text-muted-foreground">
          Chaque 1er janvier, la communauté BookMarkd célèbre l’année écoulée :
          ses livres, ses lecteurs, ses voix, ses émotions.
        </p>
      </header>

      {years.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card/80 px-6 py-12 text-center backdrop-blur">
          <Trophy className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            La première édition arrive en janvier 2027 (sur les lectures de
            2026). À très bientôt.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card/80 backdrop-blur">
          {years.map((year) => (
            <li key={year}>
              <Link
                href={`/awards/${year}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-accent/15 focus-visible:bg-accent/15 focus-visible:outline-none"
              >
                <span className="flex items-center gap-3">
                  <Trophy className="size-5 text-accent" aria-hidden />
                  <span className="text-lg font-semibold text-foreground">
                    Awards {year}
                  </span>
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Voir →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AwardsIndexPage;
