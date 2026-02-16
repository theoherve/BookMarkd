"use client";

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
      <WrappedSlide gradient="bg-gradient-to-br from-green-600 via-teal-600 to-cyan-600">
        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-white md:text-5xl">
            Votre catégorie préférée en {year}
          </h2>
          <p className="text-xl text-white/90 md:text-2xl">
            Pas assez de données pour déterminer votre catégorie préférée
          </p>
        </div>
      </WrappedSlide>
    );
  }

  return (
    <WrappedSlide gradient="bg-gradient-to-br from-green-600 via-teal-600 to-cyan-600">
      <div className="space-y-6">
        <h2 className="text-4xl font-bold text-white md:text-5xl">
          Votre catégorie préférée en {year}
        </h2>
        <div className="space-y-4">
          <div className="text-6xl font-bold text-white md:text-7xl">
            {favoriteCategory.name}
          </div>
          <div className="space-y-2">
            <p className="text-2xl text-white/90 md:text-3xl">
              {favoriteCategory.count}{" "}
              {favoriteCategory.count === 1 ? "livre" : "livres"}
            </p>
            <p className="text-xl text-white/80 md:text-2xl">
              {favoriteCategory.percentage}% de vos lectures
            </p>
          </div>
        </div>
      </div>
    </WrappedSlide>
  );
};

export default FavoriteCategorySlide;
