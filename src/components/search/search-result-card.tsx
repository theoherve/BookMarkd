"use client";

import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SearchBook } from "@/features/search/types";
import AddToReadlistButton from "@/components/search/add-to-readlist-button";
import ImportOpenLibraryButton from "@/components/search/import-open-library-button";
import { Button } from "@/components/ui/button";

type SearchResultCardProps = {
  book: SearchBook;
};

const sourceBadges: Record<SearchBook["source"], string> = {
  supabase: "Catalogue BookMarkd",
  open_library: "Open Library",
};

const buildExternalLink = (bookId: string) => {
  return `https://openlibrary.org${bookId.replace("openlib:", "/works/")}`;
};

const SearchResultCard = ({ book }: SearchResultCardProps) => {
  const isSupabaseBook = book.source === "supabase";

  return (
    <Card className="flex h-full flex-col overflow-hidden border-border/70 bg-card/80 transition hover:shadow-md">
      <CardHeader className="flex flex-row gap-4">
        <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-md border border-border/40 bg-muted">
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={book.title}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              Pas de couverture
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between">
          <div className="space-y-2">
            <CardTitle className="text-base font-semibold text-foreground">
              {book.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {book.author}
              {book.publicationYear ? ` · ${book.publicationYear}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs font-medium">
              {sourceBadges[book.source]}
            </Badge>
            {typeof book.averageRating === "number" ? (
              <Badge className="text-xs font-medium">
                {book.averageRating.toFixed(1)} / 5
              </Badge>
            ) : null}
            {book.tags?.slice(0, 2).map((tag) => (
              <Badge
                key={`${book.id}-${tag.id}`}
                variant="outline"
                className="text-xs font-medium"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {book.summary ? (
          <p className="line-clamp-3">{book.summary}</p>
        ) : (
          <p className="line-clamp-3 italic">
            Aucune description disponible. Ajoutez vos notes si vous importez ce
            livre.
          </p>
        )}
        {book.reason ? (
          <p className="text-xs text-accent-foreground">{book.reason}</p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t border-border/60 bg-card/40 p-4">
        {isSupabaseBook ? (
          <>
            <AddToReadlistButton bookId={book.id} />
            <Button variant="outline" asChild>
              <Link href={`/books/${book.id}`} aria-label={`Voir ${book.title}`}>
                Voir la fiche détaillée
              </Link>
            </Button>
          </>
        ) : (
          <div className="space-y-2">
            <Button variant="outline" asChild>
              <a
                href={buildExternalLink(book.id)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ouvrir sur Open Library
              </a>
            </Button>
            <ImportOpenLibraryButton
              openLibraryId={book.id}
              title={book.title}
              author={book.author}
              coverUrl={book.coverUrl ?? undefined}
              publicationYear={book.publicationYear ?? undefined}
              summary={book.summary ?? undefined}
            />
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default SearchResultCard;

