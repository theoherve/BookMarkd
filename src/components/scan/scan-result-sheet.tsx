"use client";

import { useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookLoader } from "@/components/ui/book-loader";
import { formatRating } from "@/lib/utils";
import { generateBookSlug } from "@/lib/slug";
import { importGoogleBooksBook } from "@/server/actions/import-google-books";
import { importOpenLibraryBook } from "@/server/actions/import-open-library";
import type { IsbnLookupResult } from "@/features/scan/types";

type ScanResultSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  result: IsbnLookupResult | null;
  isbn: string | null;
  onRetry: () => void;
};

const ScanResultSheet = ({
  open,
  onOpenChange,
  isLoading,
  result,
  isbn,
  onRetry,
}: ScanResultSheetProps) => {
  const router = useRouter();
  const [isImporting, startTransition] = useTransition();

  const book = result?.book;

  const handleViewBook = () => {
    if (!book) return;
    onOpenChange(false);
    router.push(`/books/${generateBookSlug(book.title, book.author)}`);
  };

  const handleImport = () => {
    if (!book) return;

    startTransition(async () => {
      try {
        const importResult =
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

        if (importResult.success) {
          onOpenChange(false);
          router.push(`/books/${generateBookSlug(book.title, book.author)}`);
        }
      } catch (error) {
        console.error("[ScanResultSheet] Import error:", error);
      }
    });
  };

  const handleManualCreate = () => {
    onOpenChange(false);
    const params = new URLSearchParams();
    if (isbn) params.set("isbn", isbn);
    router.push(`/books/create${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center gap-4 py-8">
            <BookLoader size="lg" text="Recherche du livre..." />
          </div>
        )}

        {/* Book found */}
        {!isLoading && result?.found && book && (
          <>
            <SheetHeader>
              <SheetTitle>Livre trouvé</SheetTitle>
              <SheetDescription>
                {result.source === "supabase"
                  ? "Ce livre est déjà dans le catalogue BookMarkd."
                  : `Trouvé via ${result.source === "google_books" ? "Google Books" : "Open Library"}.`}
              </SheetDescription>
            </SheetHeader>

            <div className="flex gap-4 px-4">
              <div className="relative h-32 w-22 shrink-0 overflow-hidden rounded-md border border-border/40 bg-muted">
                {book.coverUrl ? (
                  <Image
                    src={book.coverUrl}
                    alt={book.title}
                    fill
                    sizes="88px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground p-1">
                    Pas de couverture
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <h3 className="text-base font-semibold leading-tight">
                  {book.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {book.author}
                  {book.publicationYear ? ` · ${book.publicationYear}` : ""}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {typeof book.averageRating === "number" && (
                    <Badge className="text-xs">
                      {formatRating(book.averageRating)} / 5
                    </Badge>
                  )}
                  {book.tags?.slice(0, 3).map((tag) => (
                    <Badge key={tag.id} variant="outline" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
                {book.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {book.summary}
                  </p>
                )}
              </div>
            </div>

            <SheetFooter>
              {result.source === "supabase" ? (
                <Button onClick={handleViewBook} className="w-full">
                  Voir la fiche
                </Button>
              ) : (
                <Button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="w-full"
                >
                  {isImporting
                    ? "Import en cours..."
                    : "Importer dans BookMarkd"}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={onRetry}
                className="w-full"
              >
                Scanner un autre livre
              </Button>
            </SheetFooter>
          </>
        )}

        {/* Not found */}
        {!isLoading && result && !result.found && (
          <>
            <SheetHeader>
              <SheetTitle>Livre introuvable</SheetTitle>
              <SheetDescription>
                Aucun livre trouvé pour l&apos;ISBN {isbn}. Le livre n&apos;est
                peut-être pas référencé dans les catalogues en ligne.
              </SheetDescription>
            </SheetHeader>

            <SheetFooter>
              <Button onClick={onRetry} className="w-full">
                Réessayer le scan
              </Button>
              <Button
                variant="outline"
                onClick={handleManualCreate}
                className="w-full"
              >
                Ajouter manuellement
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ScanResultSheet;
