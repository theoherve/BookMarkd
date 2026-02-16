"use client";

import { useState, useTransition } from "react";
import Image from "next/image";

import { addBookToList } from "@/server/actions/lists";
import { importGoogleBooksBook } from "@/server/actions/import-google-books";
import { importOpenLibraryBook } from "@/server/actions/import-open-library";
import { useBookSearch } from "@/features/search/api/use-book-search";
import type { SearchBook } from "@/features/search/types";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatRating } from "@/lib/utils";

type AddListItemFormProps = {
  listId: string;
  availableBooks: never[]; // Plus utilisé mais gardé pour compatibilité
  canEdit: boolean;
};

const sourceBadges: Record<SearchBook["source"], string> = {
  supabase: "Catalogue BookMarkd",
  open_library: "Open Library",
  google_books: "Google Books",
};

const AddListItemForm = ({
  listId,
  canEdit,
}: AddListItemFormProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [addingBookId, setAddingBookId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    data: searchResults,
    isLoading: isSearching,
  } = useBookSearch(
    {
      q: submittedQuery,
      includeExternal: true,
    },
    submittedQuery.length >= 2,
  );

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedQuery(searchQuery.trim());
  };

  const handleAddBook = async (book: SearchBook) => {
    if (!canEdit) {
      return;
    }

    setAddingBookId(book.id);
    setFeedback(null);

    startTransition(async () => {
      try {
        let bookIdToAdd = book.id;

        // Si c'est un livre externe, l'importer d'abord
        if (book.source !== "supabase") {
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

          if (!importResult.success) {
            setFeedback(importResult.message || "Impossible d'importer ce livre.");
            setAddingBookId(null);
            return;
          }

          bookIdToAdd = importResult.bookId;
        }

        // Ajouter le livre à la liste
        const result = await addBookToList(
          listId,
          bookIdToAdd,
          note.trim() ? note.trim() : null,
        );

        if (!result.success) {
          setFeedback(result.message);
          setAddingBookId(null);
          return;
        }

        setFeedback(`"${book.title}" ajouté à la liste ✅`);
        setNote("");
        setSearchQuery("");
        setSubmittedQuery("");
        setAddingBookId(null);
      } catch (error) {
        console.error("[AddListItemForm] Error:", error);
        setFeedback("Une erreur est survenue lors de l'ajout.");
        setAddingBookId(null);
      }
    });
  };

  const books = searchResults?.books ?? [];
  const hasResults = books.length > 0;
  const showResults = submittedQuery.length >= 2;

  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-card/80 p-4">
      <form
        onSubmit={handleSearch}
        aria-label="Rechercher un livre à ajouter"
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="list-book-search">Rechercher un livre</Label>
          <div className="flex gap-2">
            <Input
              id="list-book-search"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Titre, auteur..."
              disabled={!canEdit || isPending}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!canEdit || isPending || searchQuery.trim().length < 2}
              aria-busy={isSearching}
            >
              Rechercher
            </Button>
          </div>
        </div>
      </form>

      {showResults && (
        <div className="space-y-2">
          {isSearching ? (
            <p className="text-sm text-muted-foreground">Recherche en cours...</p>
          ) : hasResults ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {books.map((book) => {
                const isAdding = addingBookId === book.id;
                return (
                  <div
                    key={book.id}
                    className="flex gap-3 rounded-lg border border-border/60 bg-card/60 p-3 transition hover:bg-accent/30"
                  >
                    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md border border-border/40 bg-muted">
                      {book.coverUrl ? (
                        <Image
                          src={book.coverUrl}
                          alt={book.title}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground p-1">
                          Pas de couverture
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">
                          {book.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {book.author}
                          {book.publicationYear ? ` · ${book.publicationYear}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {sourceBadges[book.source]}
                        </Badge>
                        {typeof book.averageRating === "number" ? (
                          <Badge className="text-xs">
                            {formatRating(book.averageRating)} / 5
                          </Badge>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddBook(book)}
                        disabled={!canEdit || isPending || isAdding}
                        aria-busy={isAdding}
                        className="w-full sm:w-auto"
                      >
                        {isAdding ? "Ajout..." : "Ajouter"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun résultat trouvé pour &quot;{submittedQuery}&quot;.
            </p>
          )}
        </div>
      )}

      {showResults && hasResults && (
        <div className="space-y-2 border-t border-border/60 pt-4">
          <Label htmlFor="list-note">Note (facultatif)</Label>
          <Textarea
            id="list-note"
            name="note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="Ajoutez un mot d'ordre, une consigne de lecture..."
            disabled={!canEdit || isPending}
          />
          <p className="text-xs text-muted-foreground">
            Cette note sera ajoutée à tous les livres que vous ajoutez.
          </p>
        </div>
      )}

      {feedback ? (
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {feedback}
        </p>
      ) : null}
    </div>
  );
};

export default AddListItemForm;
