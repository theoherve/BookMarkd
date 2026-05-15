"use client";

import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SimilarBook } from "@/features/books/server/get-similar-books";
import { generateBookSlug } from "@/lib/slug";

type SimilarBooksSectionProps = {
  books: SimilarBook[];
  currentBookTitle: string;
};

const SimilarBooksSection = ({ books, currentBookTitle }: SimilarBooksSectionProps) => {
  if (books.length === 0) {
    return null;
  }

  return (
    <section
      className="space-y-4"
      aria-labelledby="similar-books-heading"
    >
      <h2
        id="similar-books-heading"
        className="text-lg font-semibold text-foreground"
      >
        Livres similaires
      </h2>
      <p className="text-sm text-muted-foreground">
        Si tu as aimé <span className="font-medium text-foreground">{currentBookTitle}</span>, tu pourrais aussi apprécier&nbsp;:
      </p>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {books.map((book) => {
          const bookSlug = generateBookSlug(book.title, book.author);
          const bookHref = `/books/${bookSlug}`;
          return (
            <li key={book.id}>
              <Link
                href={bookHref}
                className="group flex h-full flex-col gap-2 rounded-lg border border-border/60 bg-card/80 p-3 transition hover:border-accent hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                aria-label={`Voir ${book.title} de ${book.author}`}
              >
                <div className="relative aspect-2/3 w-full overflow-hidden rounded border border-border/40 bg-muted">
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl}
                      alt={`Couverture de ${book.title}`}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      className="object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      Pas de couverture
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="line-clamp-2 text-sm font-medium text-muted-foreground group-hover:text-foreground">
                    {book.title}
                  </p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {book.author}
                  </p>
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent-foreground dark:text-foreground"
                        >
                          {book.compatibilityScore}%
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>
                          Compatibilité : tags en commun, notes de tes amis et popularité.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    {book.friendsCount > 0 && book.friendsAvgRating !== null ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className="rounded-full px-2 py-0.5 text-[10px] font-normal"
                          >
                            {book.friendsCount} ami{book.friendsCount > 1 ? "s" : ""} · {book.friendsAvgRating.toFixed(1)}/5
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p>
                            Note moyenne de tes amis qui ont noté ce livre.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-wrap gap-1 overflow-hidden pt-1">
                    {book.matchingTags.slice(0, 3).map((tag) => (
                      <Tooltip key={`${book.id}-${tag}`}>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="secondary"
                            className="max-w-full truncate text-[10px] font-normal"
                          >
                            <span className="truncate">{tag}</span>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="wrap-break-word">{tag}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default SimilarBooksSection;
