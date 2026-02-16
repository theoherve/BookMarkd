"use client";

import WrappedSlide from "../WrappedSlide";

const MONTH_NAMES = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

type MostProductiveMonthSlideProps = {
  mostProductiveMonth: { month: number; count: number } | null;
  year: number;
};

const MostProductiveMonthSlide = ({
  mostProductiveMonth,
  year,
}: MostProductiveMonthSlideProps) => {
  if (!mostProductiveMonth) {
    return (
      <WrappedSlide gradient="bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600">
        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-white md:text-5xl">
            Votre mois le plus productif en {year}
          </h2>
          <p className="text-xl text-white/90 md:text-2xl">
            Pas assez de données pour déterminer votre mois le plus productif
          </p>
        </div>
      </WrappedSlide>
    );
  }

  const monthName = MONTH_NAMES[mostProductiveMonth.month - 1];

  return (
    <WrappedSlide gradient="bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600">
      <div className="space-y-6">
        <h2 className="text-4xl font-bold text-white md:text-5xl">
          Votre mois le plus productif en {year}
        </h2>
        <div className="space-y-4">
          <div className="text-6xl font-bold text-white md:text-7xl capitalize">
            {monthName}
          </div>
          <p className="text-2xl text-white/90 md:text-3xl">
            {mostProductiveMonth.count}{" "}
            {mostProductiveMonth.count === 1 ? "livre lu" : "livres lus"}
          </p>
        </div>
      </div>
    </WrappedSlide>
  );
};

export default MostProductiveMonthSlide;
