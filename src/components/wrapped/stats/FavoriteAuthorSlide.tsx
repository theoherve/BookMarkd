"use client";

import { Quote } from "lucide-react";
import WrappedSlide from "../WrappedSlide";

type FavoriteAuthorSlideProps = {
  favoriteAuthor: { name: string; count: number } | null;
  year: number;
};

const plum = "#a65d70";

const FavoriteAuthorSlide = ({
  favoriteAuthor,
  year,
}: FavoriteAuthorSlideProps) => {
  if (!favoriteAuthor) {
    return (
      <WrappedSlide>
        <div className="space-y-6">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-[#6b5747] dark:text-[#bda68f]">
            Auteur favori · {year}
          </span>
          <p className="text-xl italic text-[#2f1c11]/80 md:text-2xl dark:text-[#f7f1ea]/80">
            Pas assez de données pour le déterminer
          </p>
        </div>
      </WrappedSlide>
    );
  }

  return (
    <WrappedSlide>
      <div className="flex flex-col items-center gap-5 sm:gap-7">
        <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#6b5747] sm:text-xs dark:text-[#bda68f]">
          Auteur favori · {year}
        </span>

        <Quote
          className="h-12 w-12 sm:h-14 sm:w-14"
          strokeWidth={1.5}
          style={{ color: plum }}
        />

        <h2
          className="max-w-3xl text-6xl font-bold leading-[0.95] tracking-tight sm:text-7xl md:text-8xl"
          style={{ color: plum }}
        >
          {favoriteAuthor.name}
        </h2>

        <div className="flex items-baseline gap-2 pt-2">
          <span className="text-3xl font-bold text-[#2f1c11] sm:text-4xl md:text-5xl dark:text-[#f7f1ea]">
            {favoriteAuthor.count}
          </span>
          <span className="text-base text-[#6b5747] sm:text-lg dark:text-[#bda68f]">
            {favoriteAuthor.count === 1 ? "livre lu" : "livres lus"}
          </span>
        </div>
      </div>
    </WrappedSlide>
  );
};

export default FavoriteAuthorSlide;
