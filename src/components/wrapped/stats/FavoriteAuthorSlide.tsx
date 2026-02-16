"use client";

import WrappedSlide from "../WrappedSlide";

type FavoriteAuthorSlideProps = {
  favoriteAuthor: { name: string; count: number } | null;
  year: number;
};

const FavoriteAuthorSlide = ({
  favoriteAuthor,
  year,
}: FavoriteAuthorSlideProps) => {
  if (!favoriteAuthor) {
    return (
      <WrappedSlide gradient="bg-gradient-to-br from-rose-600 via-pink-600 to-purple-600">
        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-white md:text-5xl">
            Votre auteur préféré en {year}
          </h2>
          <p className="text-xl text-white/90 md:text-2xl">
            Pas assez de données pour déterminer votre auteur préféré
          </p>
        </div>
      </WrappedSlide>
    );
  }

  return (
    <WrappedSlide gradient="bg-gradient-to-br from-rose-600 via-pink-600 to-purple-600">
      <div className="space-y-6">
        <h2 className="text-4xl font-bold text-white md:text-5xl">
          Votre auteur préféré en {year}
        </h2>
        <div className="space-y-4">
          <div className="text-5xl font-bold text-white md:text-6xl">
            {favoriteAuthor.name}
          </div>
          <p className="text-2xl text-white/90 md:text-3xl">
            {favoriteAuthor.count}{" "}
            {favoriteAuthor.count === 1 ? "livre lu" : "livres lus"}
          </p>
        </div>
      </div>
    </WrappedSlide>
  );
};

export default FavoriteAuthorSlide;
