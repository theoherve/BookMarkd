import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AwardsStoriesContainer } from "@/components/awards/awards-stories-container";
import {
  getAwardsYear,
  getWinnersForYear,
  groupWinnersByCategory,
} from "@/features/awards/server/queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ year: string }>;
};

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { year } = await params;
  return {
    title: `Cérémonie ${year}`,
    robots: { index: false, follow: false },
  };
};

const AwardsStoriesPage = async ({ params }: Props) => {
  const { year: yearParam } = await params;
  const year = Number.parseInt(yearParam, 10);
  if (!Number.isFinite(year)) notFound();

  const awardsYear = await getAwardsYear(year);
  if (!awardsYear || awardsYear.status !== "published") notFound();

  const winners = await getWinnersForYear(year);
  const grouped = groupWinnersByCategory(winners);

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 md:px-6">
      <AwardsStoriesContainer
        year={year}
        theme={awardsYear.theme}
        summary={awardsYear.summary}
        grouped={grouped}
      />
    </div>
  );
};

export default AwardsStoriesPage;
