import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AwardsRunButton } from "@/components/admin/awards/awards-run-button";
import { AwardsPublishControls } from "@/components/admin/awards/awards-publish-controls";
import { AwardsMetaEditor } from "@/components/admin/awards/awards-meta-editor";
import { AwardsWinnersPreview } from "@/components/admin/awards/awards-winners-preview";
import {
  getAwardsYear,
  getWinnersForYear,
  groupWinnersByCategory,
} from "@/features/awards/server/queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ year: string }>;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { year } = await params;
  return { title: `Awards ${year}` };
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

const AdminAwardsYearPage = async ({ params }: Props) => {
  const { year: yearParam } = await params;
  const year = Number.parseInt(yearParam, 10);
  if (!Number.isFinite(year)) notFound();

  const awardsYear = await getAwardsYear(year);
  if (!awardsYear) notFound();

  const winners = await getWinnersForYear(year);
  const grouped = groupWinnersByCategory(winners);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/awards">
            <ArrowLeft className="mr-1 size-4" />
            Retour
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">BookMarkd Awards {year}</h1>
            <Badge variant={statusVariant[awardsYear.status] ?? "outline"}>
              {statusLabel[awardsYear.status] ?? awardsYear.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {winners.length} gagnant·e·s répartis en 8 catégories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AwardsRunButton
            year={year}
            label="Recalculer"
            overwrite
            variant="outline"
          />
          <AwardsPublishControls
            year={year}
            status={awardsYear.status}
          />
        </div>
      </div>

      <AwardsMetaEditor
        year={year}
        initialTheme={awardsYear.theme}
        initialIntro={awardsYear.intro}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Synthèse</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <SummaryCell label="Livres finis" value={awardsYear.summary.totalBooksFinished} />
          <SummaryCell label="Lecteurs actifs" value={awardsYear.summary.totalUsersActive} />
          <SummaryCell label="Reviews publiques" value={awardsYear.summary.totalReviewsPublished} />
          <SummaryCell label="Ressentis publics" value={awardsYear.summary.totalFeelings} />
          <SummaryCell label="Nouveaux comptes" value={awardsYear.summary.totalNewcomers} />
        </div>
      </section>

      <AwardsWinnersPreview grouped={grouped} />
    </div>
  );
};

const SummaryCell = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg border border-border/60 bg-card/80 px-4 py-3 backdrop-blur">
    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
      {label}
    </p>
    <p className="mt-1 text-xl font-semibold">{value.toLocaleString("fr-FR")}</p>
  </div>
);

export default AdminAwardsYearPage;
