import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AwardsRunButton } from "@/components/admin/awards/awards-run-button";
import { listAwardsYears } from "@/features/awards/server/queries";
import { MIN_AWARDS_YEAR } from "@/features/awards/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "BookMarkd Awards",
};

const statusLabel: Record<string, string> = {
  draft: "Brouillon",
  published: "Publié",
  archived: "Archivé",
};

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  draft: "outline",
  published: "default",
  archived: "secondary",
};

const AdminAwardsPage = async () => {
  const years = await listAwardsYears();
  const currentYear = new Date().getUTCFullYear();
  const lastClosedYear = currentYear - 1;
  const canRunCurrent = lastClosedYear >= MIN_AWARDS_YEAR;
  const existsCurrent = years.some((y) => y.year === lastClosedYear);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">BookMarkd Awards</h1>
          <p className="text-sm text-muted-foreground">
            Cérémonies annuelles automatiques. Le cron du 1er janvier crée un
            brouillon pour l’année précédente. Vous pouvez aussi relancer
            l’agrégation manuellement.
          </p>
        </div>
        {canRunCurrent && (
          <AwardsRunButton
            year={lastClosedYear}
            label={
              existsCurrent
                ? `Recalculer ${lastClosedYear}`
                : `Lancer ${lastClosedYear}`
            }
            overwrite={existsCurrent}
          />
        )}
      </div>

      {!canRunCurrent && (
        <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Aucune édition pré-{MIN_AWARDS_YEAR}. Première édition réelle :{" "}
          {MIN_AWARDS_YEAR} (calculée le 1er janvier {MIN_AWARDS_YEAR + 1}).
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur">
        <div className="divide-y divide-border/60">
          {years.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <Trophy className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aucune édition pour l’instant.
              </p>
            </div>
          ) : (
            years.map((year) => (
              <Link
                key={year.year}
                href={`/admin/awards/${year.year}`}
                className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-accent/10"
              >
                <div className="flex items-center gap-4">
                  <Trophy className="size-5 text-accent" />
                  <div>
                    <p className="text-base font-semibold">
                      Awards {year.year}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                      {year.theme ?? "Sans thème"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {year.publishedAt && (
                    <span className="text-xs text-muted-foreground">
                      Publié le{" "}
                      {new Date(year.publishedAt).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                  <Badge variant={statusVariant[year.status] ?? "outline"}>
                    {statusLabel[year.status] ?? year.status}
                  </Badge>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAwardsPage;
