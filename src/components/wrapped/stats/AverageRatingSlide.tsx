"use client";

import WrappedSlide from "../WrappedSlide";

type AverageRatingSlideProps = {
  averageRating: number;
  year: number;
};

const AverageRatingSlide = ({
  averageRating,
  year,
}: AverageRatingSlideProps) => {
  if (averageRating === 0) {
    return (
      <WrappedSlide gradient="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-white md:text-5xl">
            Votre note moyenne en {year}
          </h2>
          <p className="text-xl text-white/90 md:text-2xl">
            Pas assez de livres notés pour cette année
          </p>
        </div>
      </WrappedSlide>
    );
  }

  return (
    <WrappedSlide gradient="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      <div className="space-y-6">
        <h2 className="text-4xl font-bold text-white md:text-5xl">
          Votre note moyenne en {year}
        </h2>
        <div className="space-y-4">
          <div className="text-8xl font-bold text-white md:text-9xl">
            {averageRating.toFixed(1)}
          </div>
          <p className="text-2xl text-white/90 md:text-3xl">sur 5</p>
        </div>
      </div>
    </WrappedSlide>
  );
};

export default AverageRatingSlide;
