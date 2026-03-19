"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trophy, BarChart3, Eye, Loader2 } from "lucide-react";

import type { EditorialListBook } from "@/types/editorial";
import { resolveEditorialBook } from "@/server/actions/resolve-editorial-book";

type Props = {
  book: EditorialListBook;
  rank: number;
};

export const EditorialBookRow = ({ book, rank }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const title = book.externalTitle ?? "Sans titre";
  const author = book.externalAuthor ?? "Auteur inconnu";
  const isSemester = book.appearances != null;

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      // If already has a local slug, navigate directly
      if (book.bookSlug) {
        router.push(`/books/${book.bookSlug}`);
        return;
      }

      const result = await resolveEditorialBook({
        bookId: book.bookId,
        externalIsbn: book.externalIsbn,
        externalTitle: book.externalTitle,
        externalAuthor: book.externalAuthor,
        externalCoverUrl: book.externalCoverUrl,
      });

      if (result.success) {
        router.push(`/books/${result.slug}`);
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-70"
    >
      {/* Rank */}
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
        {rank}
      </span>

      {/* Cover */}
      <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
        {book.externalCoverUrl ? (
          <Image
            src={book.externalCoverUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="56px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center p-1 text-center text-[9px] text-muted-foreground">
            {title}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <p className="text-sm font-semibold leading-tight text-foreground line-clamp-2">{title}</p>
        <p className="text-xs text-muted-foreground">{author}</p>

        {isSemester && (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {book.appearances != null && (
              <span className="flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {book.appearances} sem.
              </span>
            )}
            {book.bestRank != null && (
              <span className="flex items-center gap-0.5">
                <Trophy className="h-3 w-3" />
                #{book.bestRank}
              </span>
            )}
            {book.avgRank != null && (
              <span className="flex items-center gap-0.5">
                <BarChart3 className="h-3 w-3" />
                ~{Number(book.avgRank).toFixed(1)}
              </span>
            )}
          </div>
        )}

        {book.nytimesDescription && (
          <p className="mt-1 text-xs leading-snug text-muted-foreground line-clamp-2">
            {book.nytimesDescription}
          </p>
        )}

        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>

      {/* Loading indicator */}
      {isPending && (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
      )}
    </button>
  );
};
