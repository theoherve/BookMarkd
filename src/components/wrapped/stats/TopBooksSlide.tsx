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
      <WrappedSlide gradient="bg-gradient-to-br from-yellow-600 via-orange-600 to-red-600">
        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-white md:text-5xl">
            Vos meilleurs livres en {year}
          </h2>
          <p className="text-xl text-white/90 md:text-2xl">
            Pas assez de livres notés pour cette année
          </p>
        </div>
      </WrappedSlide>
    );
  }

  return (
    <WrappedSlide gradient="bg-gradient-to-br from-yellow-600 via-orange-600 to-red-600">
      <div className="space-y-8">
        <h2 className="text-4xl font-bold text-white md:text-5xl">
          Vos meilleurs livres en {year}
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {topBooks.map((book, index) => {
            const bookSlug = generateBookSlug(book.title, book.author);
            return (
              <Link
                key={book.id}
                href={`/books/${bookSlug}`}
                className="group relative flex flex-col items-center space-y-2 rounded-lg bg-white/10 p-4 backdrop-blur-sm transition hover:bg-white/20"
              >
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md">
                {book.coverUrl ? (
                  <Image
                    src={book.coverUrl}
                    alt={book.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                    <span className="text-xs">Pas de couverture</span>
                  </div>
                )}
              </div>
              <div className="w-full space-y-1 text-center">
                <p className="text-sm font-semibold text-white line-clamp-2">
                  {book.title}
                </p>
                <p className="text-xs text-white/80">{book.author}</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-sm font-bold text-yellow-300">
                    {book.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-white/70">/ 5</span>
                </div>
              </div>
                <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-sm font-bold text-gray-900">
                  #{index + 1}
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
