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
};

const SimilarBooksSection = ({ books }: SimilarBooksSectionProps) => {
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
        D&apos;autres titres de la bibliothèque BookMarkd qui partagent des tags ou le même auteur.
      </p>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {books.map((book) => {
          const bookSlug = generateBookSlug(book.title, book.author);
          const bookHref = `/books/${bookSlug}`;
          return (
            <li key={book.id}>
              <Link
                href={bookHref}
                className="group flex flex-col gap-2 rounded-lg border border-border/60 bg-card/80 p-3 transition hover:border-accent hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                aria-label={`Voir ${book.title} de ${book.author}`}
              >
                <div className="relative aspect-2/3 w-full overflow-hidden rounded border border-border/40 bg-muted">
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl}
                      alt=""
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
                  <p className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-accent-foreground">
                    {book.title}
                  </p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {book.author}
                  </p>
                  {book.matchingTags.length > 0 ? (
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
                  ) : null}
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
