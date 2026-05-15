"use client";

import { Sparkles } from "lucide-react";
import WrappedSlide from "../WrappedSlide";
import type { WrappedFeeling } from "@/features/wrapped/types";

type FeelingsSlideProps = {
  dominantFeelings: WrappedFeeling[];
  year: number;
};

const CHIP_TONES = [
  { bg: "#b66f4b", fg: "#fdfaf5" },
  { bg: "#8a9b6a", fg: "#fdfaf5" },
  { bg: "#a65d70", fg: "#fdfaf5" },
  { bg: "#6883a8", fg: "#fdfaf5" },
  { bg: "#d6b087", fg: "#2c1c12" },
];

const FeelingsSlide = ({ dominantFeelings, year }: FeelingsSlideProps) => {
  if (dominantFeelings.length === 0) {
    return (
      <WrappedSlide>
        <div className="space-y-6">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-[#6b5747] dark:text-[#bda68f]">
            Ressentis · {year}
          </span>
          <p className="text-xl italic text-[#2f1c11]/80 md:text-2xl dark:text-[#f7f1ea]/80">
            Pas de ressentis enregistrés cette année
          </p>
        </div>
      </WrappedSlide>
    );
  }

  const max = Math.max(...dominantFeelings.map((f) => f.count));

  return (
    <WrappedSlide>
      <div className="flex flex-col gap-6 sm:gap-8">
        <div className="space-y-2 sm:space-y-3">
          <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#6b5747] sm:text-xs dark:text-[#bda68f]">
            Ressentis · {year}
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-[#2f1c11] sm:text-5xl md:text-6xl dark:text-[#f7f1ea]">
            Ce que vos livres vous ont fait
            <Sparkles className="ml-2 inline h-7 w-7 text-[#d6b087] sm:h-8 sm:w-8 dark:text-[#c89a6f]" />
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4">
          {dominantFeelings.map((feeling, i) => {
            const tone = CHIP_TONES[i % CHIP_TONES.length];
            const scale = 0.85 + 0.45 * (feeling.count / max);
            return (
              <div
                key={feeling.keyword}
                className="rounded-full px-5 py-2.5 shadow-sm transition hover:-translate-y-0.5"
                style={{
                  backgroundColor: tone.bg,
                  color: tone.fg,
                  fontSize: `${scale}rem`,
                }}
              >
                <span className="font-semibold">{feeling.keyword}</span>
                <span className="ml-2 opacity-70">·{feeling.count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </WrappedSlide>
  );
};

export default FeelingsSlide;
