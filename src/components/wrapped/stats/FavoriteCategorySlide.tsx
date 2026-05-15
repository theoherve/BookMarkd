"use client";

import { BookMarked } from "lucide-react";
import WrappedSlide from "../WrappedSlide";

type FavoriteCategorySlideProps = {
  favoriteCategory: { name: string; count: number; percentage: number } | null;
  year: number;
};

const FavoriteCategorySlide = ({
  favoriteCategory,
  year,
}: FavoriteCategorySlideProps) => {
  if (!favoriteCategory) {
    return (
      <WrappedSlide>
        <div className="space-y-6">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-[#6b5747] dark:text-[#bda68f]">
            Genre favori · {year}
          </span>
          <p className="text-xl italic text-[#2f1c11]/80 md:text-2xl dark:text-[#f7f1ea]/80">
            Pas assez de données pour le déterminer
          </p>
        </div>
      </WrappedSlide>
    );
  }

  return (
    <WrappedSlide background="bg-[radial-gradient(ellipse_at_center,#f3e3cb_0%,#e4d7c6_55%,#d6b087_120%)] dark:bg-[radial-gradient(ellipse_at_center,#2f241c_0%,#1a1410_60%,#0f0c0a_100%)]">
      <div className="flex flex-col items-center gap-5 sm:gap-7">
        <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#6b5747] sm:text-xs dark:text-[#bda68f]">
          Genre favori · {year}
        </span>

        <BookMarked
          className="h-14 w-14 text-[#b66f4b] sm:h-16 sm:w-16 md:h-20 md:w-20 dark:text-[#eaad7e]"
          strokeWidth={1.5}
        />

        <h2 className="max-w-3xl text-6xl font-bold leading-tight tracking-tight text-[#2f1c11] sm:text-7xl md:text-8xl dark:text-[#f7f1ea]">
          {favoriteCategory.name}
        </h2>

        <div className="flex flex-col items-center gap-4 pt-2 sm:flex-row sm:gap-10 sm:pt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-[#b66f4b] sm:text-5xl md:text-6xl dark:text-[#eaad7e]">
              {favoriteCategory.count}
            </span>
            <span className="text-base text-[#6b5747] sm:text-lg dark:text-[#bda68f]">
              {favoriteCategory.count === 1 ? "livre" : "livres"}
            </span>
          </div>

          <div className="hidden h-12 w-px bg-[#d6b087] sm:block dark:bg-[#3c2d22]" />

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-[#b66f4b] sm:text-5xl md:text-6xl dark:text-[#eaad7e]">
              {favoriteCategory.percentage}%
            </span>
            <span className="text-base text-[#6b5747] sm:text-lg dark:text-[#bda68f]">
              de vos lectures
            </span>
          </div>
        </div>
      </div>
    </WrappedSlide>
  );
};

export default FavoriteCategorySlide;
