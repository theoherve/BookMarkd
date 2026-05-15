"use client";

import Image from "next/image";
import Link from "next/link";
import WrappedSlide from "../WrappedSlide";
import { generateBookSlug } from "@/lib/slug";
import type { WrappedBook } from "@/features/wrapped/types";

type TopBooksSlideProps = {
  topBooks: WrappedBook[];
  year: number;
};

const TopBooksSlide = ({ topBooks, year }: TopBooksSlideProps) => {
  if (topBooks.length === 0) {
    return (
      <WrappedSlide
        background="bg-[radial-gradient(ellipse_at_top,#2f1c11_0%,#1f140d_60%,#130c08_100%)]"
        textColorClass="text-[#f7f1ea]"
      >
        <div className="space-y-6">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-[#d6b087]">
            Meilleurs livres · {year}
          </span>
          <p className="text-xl italic text-[#f7f1ea]/80 md:text-2xl">
            Pas assez de livres notés
          </p>
        </div>
      </WrappedSlide>
    );
  }

  return (
    <WrappedSlide
      background="bg-[radial-gradient(ellipse_at_top,#2f1c11_0%,#1f140d_60%,#130c08_100%)]"
      textColorClass="text-[#f7f1ea]"
    >
      <div className="flex flex-col gap-5 sm:gap-7">
        <div className="space-y-2 sm:space-y-3">
          <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#d6b087] sm:text-xs">
            Top {topBooks.length} · {year}
          </span>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Vos lectures coup de cœur
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-5 md:gap-6">
          {topBooks.map((book, index) => {
            const bookSlug = generateBookSlug(book.title, book.author);
            return (
              <Link
                key={book.id}
                href={`/books/${bookSlug}`}
                className="group relative flex flex-col items-center gap-2 rounded-xl border border-[#d6b087]/15 bg-[#1f140d]/60 p-2 backdrop-blur-sm transition hover:border-[#d6b087]/40 hover:bg-[#1f140d]/80 sm:gap-3 sm:p-4"
              >
                <div className="relative aspect-2/3 w-full overflow-hidden rounded-md shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]">
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl}
                      alt={book.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#2f241c] text-[#bda68f]">
                      <span className="text-xs">Pas de couverture</span>
                    </div>
                  )}
                  <div className="absolute -top-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#d6b087] text-sm font-bold text-[#2f1c11] shadow-md">
                    {index + 1}
                  </div>
                </div>

                <div className="w-full space-y-1 text-center">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#f7f1ea]">
                    {book.title}
                  </p>
                  <p className="text-xs text-[#bda68f]">{book.author}</p>
                  <div className="flex items-center justify-center gap-1 pt-1">
                    <span className="text-sm font-bold text-[#d6b087]">
                      ★ {book.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </WrappedSlide>
  );
};

export default TopBooksSlide;
