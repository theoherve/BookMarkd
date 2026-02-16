"use client";

import WrappedSlide from "../WrappedSlide";

type TotalBooksSlideProps = {
  totalBooksRead: number;
  year: number;
};

const TotalBooksSlide = ({ totalBooksRead, year }: TotalBooksSlideProps) => {
  return (
    <WrappedSlide gradient="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
      <div className="space-y-6">
        <h2 className="text-4xl font-bold text-white md:text-5xl">
          En {year}
        </h2>
        <div className="space-y-2">
          <div className="text-8xl font-bold text-white md:text-9xl">
            {totalBooksRead}
          </div>
          <p className="text-2xl text-white/90 md:text-3xl">
            {totalBooksRead === 0
              ? "Aucun livre lu"
              : totalBooksRead === 1
                ? "livre lu"
                : "livres lus"}
          </p>
        </div>
      </div>
    </WrappedSlide>
  );
};

export default TotalBooksSlide;
