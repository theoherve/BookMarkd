"use client";

import WrappedSlide from "../WrappedSlide";

type TotalBooksSlideProps = {
  totalBooksRead: number;
  year: number;
};

const TotalBooksSlide = ({ totalBooksRead, year }: TotalBooksSlideProps) => {
  return (
    <WrappedSlide>
      <div className="flex flex-col items-center gap-6 sm:gap-7">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#d6b087]/40 bg-white/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.25em] text-[#6b5747] backdrop-blur-sm sm:text-xs dark:border-[#c89a6f]/30 dark:bg-black/30 dark:text-[#bda68f]">
          Bookmarkd Wrapped · {year}
        </span>
        <p className="text-lg italic text-[#6b5747] sm:text-xl md:text-2xl dark:text-[#bda68f]">
          Cette année, vous avez lu
        </p>
        <div className="relative">
          <div className="text-[13rem] font-bold leading-none tracking-tight text-[#b66f4b] sm:text-[14rem] md:text-[15rem] dark:text-[#eaad7e]">
            {totalBooksRead}
          </div>
          <div
            aria-hidden
            className="absolute -inset-x-6 -inset-y-2 -z-10 rounded-full bg-[#d6b087]/15 blur-3xl dark:bg-[#c89a6f]/20"
          />
        </div>
        <p className="text-2xl font-medium text-[#2f1c11] sm:text-3xl md:text-4xl dark:text-[#f7f1ea]">
          {totalBooksRead === 0
            ? "aucun livre"
            : totalBooksRead === 1
              ? "livre"
              : "livres"}
        </p>
      </div>
    </WrappedSlide>
  );
};

export default TotalBooksSlide;
