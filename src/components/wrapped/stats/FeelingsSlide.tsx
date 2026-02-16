"use client";

import WrappedSlide from "../WrappedSlide";
import type { WrappedFeeling } from "@/features/wrapped/types";

type FeelingsSlideProps = {
  dominantFeelings: WrappedFeeling[];
  year: number;
};

const FeelingsSlide = ({
  dominantFeelings,
  year,
}: FeelingsSlideProps) => {
  if (dominantFeelings.length === 0) {
    return (
      <WrappedSlide gradient="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600">
        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-white md:text-5xl">
            Vos sentiments en {year}
          </h2>
          <p className="text-xl text-white/90 md:text-2xl">
            Pas de sentiments enregistrés pour cette année
          </p>
        </div>
      </WrappedSlide>
    );
  }

  return (
    <WrappedSlide gradient="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600">
      <div className="space-y-8">
        <h2 className="text-4xl font-bold text-white md:text-5xl">
          Vos sentiments en {year}
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          {dominantFeelings.map((feeling) => (
            <div
              key={feeling.keyword}
              className="rounded-full bg-white/20 px-6 py-3 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-white">
                  {feeling.keyword}
                </span>
                <span className="text-lg text-white/80">
                  ({feeling.count})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WrappedSlide>
  );
};

export default FeelingsSlide;
