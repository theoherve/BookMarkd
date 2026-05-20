import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AwardsHero } from "@/components/awards/awards-hero";
import { AwardsPodium } from "@/components/awards/awards-podium";
import { AwardsStoriesEntry } from "@/components/awards/awards-stories-entry";
import { AwardsJsonLd } from "@/components/awards/awards-json-ld";
import {
  getAwardsYear,
  getPublishedYears,
  getWinnersForYear,
  groupWinnersByCategory,
} from "@/features/awards/server/queries";
import type { AwardCategory } from "@/features/awards/types";

export const revalidate = 3600;

type Props = {
  params: Promise<{ year: string }>;
};

export const generateStaticParams = async () => {
  try {
    const years = await getPublishedYears();
    return years.map((year) => ({ year: String(year) }));
  } catch (error) {
    console.warn(
      "[awards] generateStaticParams: skipping static prerender (DB unreachable).",
      error,
    );
    return [];
  }
};

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { year: yearParam } = await params;
  const year = Number.parseInt(yearParam, 10);
  if (!Number.isFinite(year)) {
    return { title: "BookMarkd Awards" };
  }
  const awardsYear = await getAwardsYear(year);
  if (!awardsYear || awardsYear.status !== "published") {
    return { title: `Awards ${year}`, robots: { index: false, follow: false } };
  }
  const title = `BookMarkd Awards ${year}`;
  const description =
    awardsYear.intro ??
    `Les meilleurs livres, lecteurs, critiques et ressentis de ${year} sur BookMarkd.`;
  const ogImage = `/awards/${year}/opengraph-image`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
};

const SECONDARY_ORDER: AwardCategory[] = [
  "reader_of_the_year",
  "most_loved_review",
  "top_reviewer",
  "feeling_award",
  "trending_wishlist",
  "best_newcomer",
  "top_categories",
];

const AwardsPublicPage = async ({ params }: Props) => {
  const { year: yearParam } = await params;
  const year = Number.parseInt(yearParam, 10);
  if (!Number.isFinite(year)) notFound();

  const awardsYear = await getAwardsYear(year);
  if (!awardsYear || awardsYear.status !== "published") notFound();

  const winners = await getWinnersForYear(year);
  const grouped = groupWinnersByCategory(winners);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-12 px-4 py-10 md:px-6 md:py-14">
      <AwardsJsonLd
        year={year}
        publishedAt={awardsYear.publishedAt}
        theme={awardsYear.theme}
        intro={awardsYear.intro}
        url={`https://bookmarkd.app/awards/${year}`}
      />
      <AwardsHero
        year={year}
        theme={awardsYear.theme}
        intro={awardsYear.intro}
        summary={awardsYear.summary}
        publishedAt={awardsYear.publishedAt}
      />

      <AwardsPodium
        category="book_of_the_year"
        winners={grouped.book_of_the_year}
        variant="spotlight"
      />

      <AwardsStoriesEntry year={year} />

      {SECONDARY_ORDER.map((category) => (
        <AwardsPodium
          key={category}
          category={category}
          winners={grouped[category]}
        />
      ))}
    </div>
  );
};

export default AwardsPublicPage;
