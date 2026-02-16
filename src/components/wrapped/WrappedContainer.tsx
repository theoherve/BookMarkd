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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Aucune donnée disponible</h1>
          <p className="mt-2 text-muted-foreground">
            Vous n&apos;avez pas encore de statistiques pour cette année.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Slide actuelle */}
      <div className="relative">{slides[currentSlide]?.component}</div>

      {/* Navigation */}
      <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          disabled={currentSlide === 0}
          className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
          aria-label="Slide précédente"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </Button>

        {/* Barre de progression */}
        <div className="flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? "w-8 bg-white"
                  : "w-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Aller à la slide ${index + 1}`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentSlide === slides.length - 1}
          className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
          aria-label="Slide suivante"
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Bouton de sortie */}
      <div className="fixed top-8 left-8 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={handleExit}
          className="h-12 w-12 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30"
          aria-label="Quitter le wrapped"
        >
          <X className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Indicateur de slide */}
      <div className="fixed top-8 right-8 z-50 rounded-full bg-black/20 px-4 py-2 text-sm text-white backdrop-blur-sm">
        {currentSlide + 1} / {slides.length}
      </div>

      {/* Partage à la dernière slide */}
      {currentSlide === slides.length - 1 && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2">
          <WrappedShare
            year={stats.year}
            stats={{
              totalBooksRead: stats.totalBooksRead,
              favoriteCategory: stats.favoriteCategory?.name || null,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default WrappedContainer;
