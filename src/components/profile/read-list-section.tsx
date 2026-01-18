"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRating } from "@/lib/utils";
import { generateBookSlug } from "@/lib/slug";
import { removeBookFromReadlist } from "@/server/actions/readlist";
import type { ReadListBook } from "@/features/profile/types";

type ReadListSectionProps = {
  readList: ReadListBook[];
};

const statusLabels: Record<ReadListBook["status"], string> = {
  to_read: "À lire",
  reading: "En cours",
  finished: "Lu",
};

type FilterStatus = ReadListBook["status"] | "all";

const ReadListSection = ({ readList }: ReadListSectionProps) => {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [removingBookIds, setRemovingBookIds] = useState<Set<string>>(new Set());

  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
  };

  const handleRemoveBook = (bookId: string) => {
    setRemovingBookIds((prev) => new Set(prev).add(bookId));
    removeBookFromReadlist(bookId).finally(() => {
      setRemovingBookIds((prev) => {
        const next = new Set(prev);
        next.delete(bookId);
        return next;
      });
    });
  };

  const filteredReadList =
    filterStatus === "all"
      ? readList
      : readList.filter((item) => item.status === filterStatus);

  if (readList.length === 0) {
    return (
      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            Ma read list
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Vos livres ajoutés à votre liste de lecture.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucun livre dans votre read list.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/search">Chercher un livre</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur overflow-hidden max-w-full flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">
          Ma read list
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Vos livres ajoutés à votre liste de lecture.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("all")}
            aria-label="Afficher tous les livres"
          >
            Tous
          </Button>
          <Button
            variant={filterStatus === "to_read" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("to_read")}
            aria-label="Afficher les livres à lire"
          >
            À lire
          </Button>
          <Button
            variant={filterStatus === "reading" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("reading")}
            aria-label="Afficher les livres en cours"
          >
            En cours
          </Button>
          <Button
            variant={filterStatus === "finished" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("finished")}
            aria-label="Afficher les livres lus"
          >
            Lu
          </Button>
        </div>
        {filteredReadList.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucun livre dans cette catégorie.
          </p>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-hidden -mx-6">
              <div className="horizontal-scroll overflow-x-auto overflow-y-hidden scroll-smooth h-full px-6">
                <div className="flex gap-3 md:gap-4 min-w-max h-full items-stretch pb-2">
                  {filteredReadList.slice(0, 20).map((item) => {
                    const isRemoving = removingBookIds.has(item.bookId);
                    return (
                      <div
                        key={item.id}
                        className="relative flex h-full w-40 min-w-40 md:w-48 md:min-w-48 shrink-0 flex-col gap-3 rounded-lg border border-border/50 bg-background/60 p-3 transition hover:border-border hover:shadow-md"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveBook(item.bookId);
                          }}
                          disabled={isRemoving}
                          className="absolute right-2 top-2 z-10 h-6 w-6 p-0 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                          aria-label={`Retirer ${item.book.title} de votre readlist`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Link
                          href={`/books/${generateBookSlug(item.book.title, item.book.author)}`}
                          className="flex h-full flex-col gap-3 cursor-pointer"
                          aria-label={`Voir ${item.book.title}`}
                        >
                          <div
                            className="relative flex-1 w-full overflow-hidden rounded bg-muted"
                            style={{ aspectRatio: "3 / 4" }}
                          >
                            {item.book.coverUrl ? (
                              <Image
                                src={item.book.coverUrl}
                                alt={item.book.title}
                                fill
                                sizes="(max-width: 768px) 160px, 192px"
                                className="object-contain"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                Pas de couverture
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
                                {item.book.title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {item.book.author}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant="outline" className="text-xs">
                                {statusLabels[item.status]}
                              </Badge>
                              {item.rating ? (
                                <Badge variant="secondary" className="text-xs">
                                  {formatRating(item.rating)}/5
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {filteredReadList.length > 20 && (
              <p className="mt-4 text-sm text-muted-foreground text-center">
                Et {filteredReadList.length - 20} autre{filteredReadList.length - 20 > 1 ? "s" : ""} livre{filteredReadList.length - 20 > 1 ? "s" : ""}...
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ReadListSection;

