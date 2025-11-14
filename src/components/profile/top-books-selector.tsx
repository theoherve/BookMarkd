"use client";

import { useState, useTransition, FormEvent } from "react";
import Image from "next/image";
import { X, Search } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookSearch } from "@/features/search/api/use-book-search";
import type { SearchBook } from "@/features/search/types";
import { updateTopBooks } from "@/server/actions/profile";
import type { TopBook } from "@/features/profile/types";

type TopBooksSelectorProps = {
  initialTopBooks: TopBook[];
};

const TopBooksSelector = ({ initialTopBooks }: TopBooksSelectorProps) => {
  const [topBooks, setTopBooks] = useState<Array<{ bookId: string; position: number; book: SearchBook | null }>>(
    initialTopBooks.map((tb) => ({
      bookId: tb.bookId,
      position: tb.position,
      book: {
        id: tb.book.id,
        title: tb.book.title,
        author: tb.book.author,
        coverUrl: tb.book.coverUrl,
        source: "supabase" as const,
      },
    }))
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { data: searchData, isLoading: isSearchLoading } = useBookSearch(
    {
      q: submittedQuery,
      includeExternal: false,
    },
    Boolean(submittedQuery)
  );

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedQuery(searchQuery.trim());
  };

  const handleSelectBook = (book: SearchBook, position: number) => {
    if (book.source !== "supabase") {
      setFeedback("Seuls les livres du catalogue BookMarkd peuvent être ajoutés au top 3.");
      return;
    }

    const newTopBooks = [...topBooks];
    const existingIndex = newTopBooks.findIndex((tb) => tb.position === position);
    const bookExistsIndex = newTopBooks.findIndex((tb) => tb.bookId === book.id);

    if (bookExistsIndex !== -1 && bookExistsIndex !== existingIndex) {
      setFeedback("Ce livre est déjà dans votre top 3.");
      return;
    }

    if (existingIndex !== -1) {
      newTopBooks[existingIndex] = { bookId: book.id, position, book };
    } else {
      newTopBooks.push({ bookId: book.id, position, book });
    }

    setTopBooks(newTopBooks);
    setSearchQuery("");
    setSubmittedQuery("");
    setFeedback(null);
  };

  const handleRemoveBook = (position: number) => {
    setTopBooks(topBooks.filter((tb) => tb.position !== position));
  };

  const handleSave = () => {
    setFeedback(null);
    startTransition(async () => {
      const topBooksToSave = topBooks
        .filter((tb) => tb.book !== null)
        .map((tb) => ({
          bookId: tb.bookId,
          position: tb.position,
        }));

      const result = await updateTopBooks({ topBooks: topBooksToSave });
      if (result.success) {
        setFeedback("Top 3 mis à jour avec succès.");
        setTimeout(() => {
          setFeedback(null);
        }, 3000);
      } else {
        setFeedback(result.message);
      }
    });
  };

  const getBookForPosition = (position: number) => {
    return topBooks.find((tb) => tb.position === position);
  };

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">
          Mon top 3 livres of all time
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Sélectionnez vos 3 livres préférés.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((position) => {
            const topBook = getBookForPosition(position);
            return (
              <div
                key={position}
                className="space-y-2 rounded-lg border border-border/50 bg-background/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs font-semibold">
                    #{position}
                  </Badge>
                  {topBook?.book ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBook(position)}
                      aria-label={`Retirer ${topBook.book.title}`}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
                {topBook?.book ? (
                  <div className="space-y-2">
                    <div className="relative h-32 w-24 overflow-hidden rounded-md border border-border/40 bg-muted">
                      {topBook.book.coverUrl ? (
                        <Image
                          src={topBook.book.coverUrl}
                          alt={topBook.book.title}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          Pas de couverture
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground line-clamp-2">
                        {topBook.book.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {topBook.book.author}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                    Aucun livre sélectionné
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <form onSubmit={handleSearch} className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un livre..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={!searchQuery.trim()}>
                Rechercher
              </Button>
            </div>
          </form>

          {submittedQuery && (
            <div className="space-y-2">
              {isSearchLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : searchData?.books && searchData.books.length > 0 ? (
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border/50 bg-background/60 p-2">
                  {searchData.books
                    .filter((book) => book.source === "supabase")
                    .map((book) => {
                      const isSelected = topBooks.some(
                        (tb) => tb.bookId === book.id
                      );
                      return (
                        <div
                          key={book.id}
                          className="flex items-center gap-3 rounded-md border border-border/40 bg-card p-2 transition hover:bg-muted/50"
                        >
                          <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded border border-border/40 bg-muted">
                            {book.coverUrl ? (
                              <Image
                                src={book.coverUrl}
                                alt={book.title}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                Pas de couverture
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-semibold text-foreground line-clamp-1">
                              {book.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {book.author}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3].map((pos) => {
                              const currentBook = getBookForPosition(pos);
                              const isPositionSelected = currentBook?.bookId === book.id;
                              return (
                                <Button
                                  key={pos}
                                  variant={isPositionSelected ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleSelectBook(book, pos)}
                                  disabled={isSelected && !isPositionSelected}
                                  className="h-8 w-8 p-0 text-xs"
                                  aria-label={`Sélectionner ${book.title} en position ${pos}`}
                                >
                                  {pos}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun résultat trouvé.
                </p>
              )}
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={isPending} className="w-full">
          {isPending ? "Enregistrement..." : "Enregistrer le top 3"}
        </Button>

        {feedback ? (
          <p
            className={`text-sm text-center ${
              feedback.includes("succès")
                ? "text-green-600 dark:text-green-400"
                : "text-destructive"
            }`}
          >
            {feedback}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default TopBooksSelector;

