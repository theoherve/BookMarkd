"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AwardsIntroSlide } from "./stories/awards-intro-slide";
import { AwardsSummarySlide } from "./stories/awards-summary-slide";
import { AwardsCategorySlide } from "./stories/awards-category-slide";
import { AwardsOutroSlide } from "./stories/awards-outro-slide";
import type {
  AwardCategory,
  AwardWinner,
  AwardsYearSummary,
} from "@/features/awards/types";

type Props = {
  year: number;
  theme: string | null;
  summary: AwardsYearSummary;
  grouped: Record<AwardCategory, AwardWinner[]>;
};

// Sequence: build up to the Book of the Year climax.
const SEQUENCE: AwardCategory[] = [
  "best_newcomer",
  "trending_wishlist",
  "top_categories",
  "feeling_award",
  "most_loved_review",
  "top_reviewer",
  "reader_of_the_year",
  "book_of_the_year",
];

export const AwardsStoriesContainer = ({
  year,
  theme,
  summary,
  grouped,
}: Props) => {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: { key: string; node: React.ReactNode }[] = [
    {
      key: "intro",
      node: <AwardsIntroSlide year={year} theme={theme} />,
    },
    {
      key: "summary",
      node: <AwardsSummarySlide year={year} summary={summary} />,
    },
    ...SEQUENCE.map((category) => ({
      key: `category-${category}`,
      node: (
        <AwardsCategorySlide
          category={category}
          winners={grouped[category]}
          spotlight={category === "book_of_the_year"}
        />
      ),
    })),
    {
      key: "outro",
      node: <AwardsOutroSlide year={year} />,
    },
  ];

  const handleExit = () => router.push(`/awards/${year}`);
  const handlePrev = () =>
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  const handleNext = () =>
    setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
      else if (e.key === "Escape") handleExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  return (
    <div className="flex w-full min-h-[calc(100dvh-4rem)] flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleExit}
          aria-label="Quitter la cérémonie"
          className="h-10 w-10 rounded-full border border-accent/40 bg-background/70 text-foreground backdrop-blur hover:bg-background"
        >
          <X className="size-5" />
        </Button>
        <div className="rounded-full border border-accent/40 bg-background/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground backdrop-blur">
          {currentSlide + 1} / {slides.length}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {slides[currentSlide]?.node}
      </div>

      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-full border border-accent/40 bg-background/70 p-1.5 backdrop-blur">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentSlide === 0}
            aria-label="Slide précédente"
            className="h-9 gap-1 rounded-full px-3 disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
            <span className="hidden text-sm sm:inline">Précédent</span>
          </Button>

          <div className="flex items-center gap-1.5 px-2">
            {slides.map((s, index) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setCurrentSlide(index)}
                aria-label={`Aller à la slide ${index + 1}`}
                className={
                  index === currentSlide
                    ? "h-1.5 w-6 rounded-full bg-accent transition-all"
                    : "h-1.5 w-1.5 rounded-full bg-accent/40 transition-all hover:bg-accent/70"
                }
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={currentSlide === slides.length - 1}
            aria-label="Slide suivante"
            className="h-9 gap-1 rounded-full px-3 disabled:opacity-30"
          >
            <span className="hidden text-sm sm:inline">Suivant</span>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
