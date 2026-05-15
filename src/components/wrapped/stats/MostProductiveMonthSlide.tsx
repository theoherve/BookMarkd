"use client";

import { CalendarRange } from "lucide-react";
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

const slate = "#6883a8";

const MostProductiveMonthSlide = ({
  mostProductiveMonth,
  year,
}: MostProductiveMonthSlideProps) => {
  if (!mostProductiveMonth) {
    return (
      <WrappedSlide>
        <div className="space-y-6">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-[#6b5747] dark:text-[#bda68f]">
            Mois le plus productif · {year}
          </span>
          <p className="text-xl italic text-[#2f1c11]/80 md:text-2xl dark:text-[#f7f1ea]/80">
            Pas assez de données pour le déterminer
          </p>
        </div>
      </WrappedSlide>
    );
  }

  const monthName = MONTH_NAMES[mostProductiveMonth.month - 1];

  return (
    <WrappedSlide>
      <div className="flex flex-col items-center gap-5 sm:gap-7">
        <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#6b5747] sm:text-xs dark:text-[#bda68f]">
          Mois le plus productif · {year}
        </span>

        <CalendarRange
          className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20"
          strokeWidth={1.5}
          style={{ color: slate }}
        />

        <h2
          className="text-7xl font-bold capitalize tracking-tight sm:text-8xl md:text-9xl"
          style={{ color: slate }}
        >
          {monthName}
        </h2>

        <div className="flex items-baseline gap-3 pt-2">
          <span className="text-4xl font-bold text-[#2f1c11] sm:text-5xl md:text-6xl dark:text-[#f7f1ea]">
            {mostProductiveMonth.count}
          </span>
          <span className="text-base text-[#6b5747] sm:text-lg dark:text-[#bda68f]">
            {mostProductiveMonth.count === 1 ? "livre lu" : "livres lus"}
          </span>
        </div>
      </div>
    </WrappedSlide>
  );
};

export default MostProductiveMonthSlide;
