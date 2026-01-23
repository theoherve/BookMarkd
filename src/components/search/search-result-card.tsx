"use client";

import { useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { formatRating } from "@/lib/utils";
import { generateBookSlug } from "@/lib/slug";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SearchBook } from "@/features/search/types";
import { importGoogleBooksBook } from "@/server/actions/import-google-books";
import { importOpenLibraryBook } from "@/server/actions/import-open-library";

type SearchResultCardProps = {
  book: SearchBook;
};

const sourceBadges: Record<SearchBook["source"], string> = {
  supabase: "Catalogue BookMarkd",
  open_library: "Open Library",
  google_books: "Google Books",
};

const SearchResultCard = ({ book }: SearchResultCardProps) => {
  const router = useRouter();
  const isSupabaseBook = book.source === "supabase";
  const [isImporting, startTransition] = useTransition();

  const handleCardClick = () => {
    if (isSupabaseBook) {
      // Pour les livres déjà dans BookMarkd (y compris les livres importés), rediriger vers la fiche
      router.push(`/books/${generateBookSlug(book.title, book.author)}`);
      return;
    }

    // Pour les livres externes, importer automatiquement
    startTransition(async () => {
      try {
        const result =
          book.source === "google_books"
            ? await importGoogleBooksBook({
              googleBooksId: book.id,
              title: book.title,
              author: book.author,
              coverUrl: book.coverUrl ?? undefined,
              publicationYear: book.publicationYear ?? undefined,
              summary: book.summary ?? undefined,
            })
            : await importOpenLibraryBook({
              openLibraryId: book.id,
              title: book.title,
              author: book.author,
              coverUrl: book.coverUrl ?? undefined,
              publicationYear: book.publicationYear ?? undefined,
              summary: book.summary ?? undefined,
            });

        if (result.success) {
          // Rediriger vers la fiche du livre importé
          router.push(`/books/${generateBookSlug(book.title, book.author)}`);
        }
      } catch (error) {
        console.error("[SearchResultCard] Import error:", error);
      }
    });
  };

  return (
    <Card
      className={`flex h-full flex-col overflow-hidden border-border/70 bg-card/80 transition hover:shadow-md ${isImporting
        ? "opacity-60 cursor-wait"
        : "cursor-pointer"
        }`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={
        isSupabaseBook
          ? `Voir ${book.title} par ${book.author}`
          : `Importer ${book.title} par ${book.author} dans BookMarkd`
      }
    >
      <CardHeader className="flex flex-row gap-4">
        <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-md border border-border/40 bg-muted">
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={book.title}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground p-1">
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
                {formatRating(book.averageRating)} / 5
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
        {/* {book.reason ? (
          <p className="text-xs text-accent-foreground">{book.reason}</p>
        ) : null} */}
      </CardContent>
      {/* <CardFooter className="flex flex-col gap-3 border-t border-border/60 bg-card/40 p-4">
        {isSupabaseBook ? (
          <>
            <AddToReadlistButton bookId={book.id} />
            <Button variant="outline" asChild>
              <Link href={`/books/${generateBookSlug(book.title, book.author)}`} aria-label={`Voir ${book.title}`}>
                Voir la fiche détaillée
              </Link>
            </Button>
          </>
        ) : (
          <div className="space-y-2 w-full">
            {isImporting ? (
              <p className="text-sm text-muted-foreground text-center">
                Import en cours...
              </p>
            ) : importError ? (
              <p className="text-sm text-destructive text-center">{importError}</p>
            ) : (
              <p className="text-xs text-muted-foreground text-center">
                Cliquez sur la carte pour importer ce livre dans BookMarkd
              </p>
            )}
            {showGoogleBooksLink ? (
              <Button
                variant="outline"
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <a
                  href={externalLink ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ouvrir sur Google Books
                </a>
              </Button>
            ) : null}
          </div>
        )}
      </CardFooter> */}
    </Card>
  );
};

export default SearchResultCard;
