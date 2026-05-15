"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import TotalBooksSlide from "./stats/TotalBooksSlide";
import FavoriteCategorySlide from "./stats/FavoriteCategorySlide";
import TopBooksSlide from "./stats/TopBooksSlide";
import AverageRatingSlide from "./stats/AverageRatingSlide";
import FavoriteAuthorSlide from "./stats/FavoriteAuthorSlide";
import MostProductiveMonthSlide from "./stats/MostProductiveMonthSlide";
import FeelingsSlide from "./stats/FeelingsSlide";
import WrappedShare from "./WrappedShare";
import type { WrappedStats } from "@/features/wrapped/types";

type WrappedContainerProps = {
  stats: WrappedStats;
};

const WrappedContainer = ({ stats }: WrappedContainerProps) => {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Créer les slides en fonction des données disponibles
  const slides: Array<{ component: React.ReactNode; key: string }> = [];

  // Slide 1: Total books
  slides.push({
    key: "total-books",
    component: (
      <TotalBooksSlide
        totalBooksRead={stats.totalBooksRead}
        year={stats.year}
      />
    ),
  });

  // Slide 2: Average rating (si des livres ont été notés)
  if (stats.averageRating > 0) {
    slides.push({
      key: "average-rating",
      component: (
        <AverageRatingSlide
          averageRating={stats.averageRating}
          year={stats.year}
        />
      ),
    });
  }

  // Slide 3: Favorite category
  if (stats.favoriteCategory) {
    slides.push({
      key: "favorite-category",
      component: (
        <FavoriteCategorySlide
          favoriteCategory={stats.favoriteCategory}
          year={stats.year}
        />
      ),
    });
  }

  // Slide 4: Top books
  if (stats.topBooks.length > 0) {
    slides.push({
      key: "top-books",
      component: <TopBooksSlide topBooks={stats.topBooks} year={stats.year} />,
    });
  }

  // Slide 5: Favorite author
  if (stats.favoriteAuthor) {
    slides.push({
      key: "favorite-author",
      component: (
        <FavoriteAuthorSlide
          favoriteAuthor={stats.favoriteAuthor}
          year={stats.year}
        />
      ),
    });
  }

  // Slide 6: Most productive month
  if (stats.mostProductiveMonth) {
    slides.push({
      key: "most-productive-month",
      component: (
        <MostProductiveMonthSlide
          mostProductiveMonth={stats.mostProductiveMonth}
          year={stats.year}
        />
      ),
    });
  }

  // Slide 7: Feelings
  if (stats.dominantFeelings.length > 0) {
    slides.push({
      key: "feelings",
      component: (
        <FeelingsSlide
          dominantFeelings={stats.dominantFeelings}
          year={stats.year}
        />
      ),
    });
  }

  const handlePrevious = () => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1));
  };

  const handleExit = () => {
    router.push("/feed");
  };

  // Navigation au clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === "Escape") {
        router.push("/feed");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, slides.length]);

  if (slides.length === 0) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Aucune donnée disponible
          </h1>
          <p className="mt-2 text-muted-foreground">
            Vous n&apos;avez pas encore de statistiques pour cette année.
          </p>
        </div>
      </div>
    );
  }

  const isLast = currentSlide === slides.length - 1;

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Top chrome — inline, above slide */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleExit}
          className="h-10 w-10 rounded-full border border-[#d6b087]/40 bg-[#fdfaf5]/70 text-[#2f1c11] backdrop-blur-md hover:bg-[#fdfaf5] dark:border-[#c89a6f]/30 dark:bg-[#1a1410]/70 dark:text-[#f7f1ea] dark:hover:bg-[#1a1410]"
          aria-label="Quitter le wrapped"
        >
          <X className="h-5 w-5" />
        </Button>

        {slides.length > 1 ? (
          <div className="rounded-full border border-[#d6b087]/40 bg-[#fdfaf5]/70 px-3.5 py-1.5 text-xs font-medium tracking-wide text-[#6b5747] backdrop-blur-md dark:border-[#c89a6f]/30 dark:bg-[#1a1410]/70 dark:text-[#bda68f]">
            {currentSlide + 1} / {slides.length}
          </div>
        ) : (
          <span aria-hidden className="h-10 w-10" />
        )}
      </div>

      {/* Slide — flex-1 fills remaining viewport */}
      <div className="flex min-h-0 flex-1 flex-col">
        {slides[currentSlide]?.component}
      </div>

      {/* Bottom chrome — inline, below slide */}
      <div className="flex flex-col items-center gap-3">
        {isLast && (
          <WrappedShare
            year={stats.year}
            stats={{
              totalBooksRead: stats.totalBooksRead,
              favoriteCategory: stats.favoriteCategory?.name || null,
            }}
          />
        )}

        {slides.length > 1 && (
          <div className="flex items-center gap-2 rounded-full border border-[#d6b087]/40 bg-[#fdfaf5]/70 p-1.5 backdrop-blur-md dark:border-[#c89a6f]/30 dark:bg-[#1a1410]/70">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={currentSlide === 0}
              className="h-9 gap-1 rounded-full px-3 text-[#2f1c11] hover:bg-[#efe6dc] disabled:opacity-30 dark:text-[#f7f1ea] dark:hover:bg-[#221b15]"
              aria-label="Slide précédente"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden text-sm sm:inline">Précédent</span>
            </Button>

            <div className="flex items-center gap-1.5 px-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentSlide
                      ? "w-6 bg-[#b66f4b] dark:bg-[#eaad7e]"
                      : "w-1.5 bg-[#d6b087]/60 hover:bg-[#d6b087] dark:bg-[#c89a6f]/40 dark:hover:bg-[#c89a6f]"
                  }`}
                  aria-label={`Aller à la slide ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              disabled={currentSlide === slides.length - 1}
              className="h-9 gap-1 rounded-full px-3 text-[#2f1c11] hover:bg-[#efe6dc] disabled:opacity-30 dark:text-[#f7f1ea] dark:hover:bg-[#221b15]"
              aria-label="Slide suivante"
            >
              <span className="hidden text-sm sm:inline">Suivant</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WrappedContainer;
