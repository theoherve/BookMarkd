"use client";

import { Star } from "lucide-react";
import WrappedSlide from "../WrappedSlide";

type AverageRatingSlideProps = {
  averageRating: number;
  year: number;
};

const olive = "#8a9b6a";
const oliveDark = "#98b780";

const AverageRatingSlide = ({
  averageRating,
  year,
}: AverageRatingSlideProps) => {
  const filled = Math.round(averageRating);

  if (averageRating === 0) {
    return (
      <WrappedSlide>
        <div className="space-y-6">
          <span className="inline-block text-xs font-medium uppercase tracking-[0.25em] text-[#6b5747] dark:text-[#bda68f]">
            Note moyenne · {year}
          </span>
          <p className="text-xl text-[#2f1c11]/80 italic md:text-2xl dark:text-[#f7f1ea]/80">
            Pas assez de livres notés cette année
          </p>
        </div>
      </WrappedSlide>
    );
  }

  return (
    <WrappedSlide>
      <div className="flex flex-col items-center gap-6 sm:gap-8">
        <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#6b5747] sm:text-xs dark:text-[#bda68f]">
          Note moyenne · {year}
        </span>

        <div className="flex items-end gap-3">
          <span
            className="text-[11rem] font-bold leading-none tracking-tight sm:text-[12rem] md:text-[13rem]"
            style={{ color: olive }}
          >
            {averageRating.toFixed(1)}
          </span>
          <span className="mb-5 text-3xl font-light text-[#6b5747] sm:mb-7 sm:text-4xl md:mb-9 md:text-5xl dark:text-[#bda68f]">
            /5
          </span>
        </div>

        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12"
              fill={i < filled ? olive : "transparent"}
              stroke={i < filled ? olive : "#d6b087"}
              strokeWidth={1.5}
              style={
                i < filled
                  ? { color: olive, ["--star-dark" as never]: oliveDark }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </WrappedSlide>
  );
};

export default AverageRatingSlide;
