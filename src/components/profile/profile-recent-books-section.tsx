"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRating } from "@/lib/utils";
import { generateBookSlug } from "@/lib/slug";
import type { PublicProfile } from "@/features/profile/server/get-public-profile";

type ViewMode = "cards" | "table";

const PROFILE_RECENT_VIEW_STORAGE_KEY = "book-markd-profile-recent-view";

const getStoredViewMode = (): ViewMode => {
  if (typeof window === "undefined") return "cards";
  const stored = localStorage.getItem(PROFILE_RECENT_VIEW_STORAGE_KEY);
  if (stored === "table" || stored === "cards") return stored;
  return "cards";
};

type ProfileRecentBooksSectionProps = {
  books: PublicProfile["recentBooks"];
};

const statusLabels: Record<"to_read" | "reading" | "finished", string> = {
  to_read: "À lire",
  reading: "En cours",
  finished: "Terminé",
};

const ProfileRecentBooksSection = ({ books }: ProfileRecentBooksSectionProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => getStoredViewMode());

  const handleViewModeToggle = () => {
    setViewMode((prev) => {
      const next = prev === "cards" ? "table" : "cards";
      localStorage.setItem(PROFILE_RECENT_VIEW_STORAGE_KEY, next);
      return next;
    });
  };

  if (books.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold text-foreground">
          Lectures récentes
        </h2>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleViewModeToggle}
          aria-label={viewMode === "cards" ? "Afficher en liste (tableau)" : "Afficher en cartes"}
          title={viewMode === "cards" ? "Afficher en liste" : "Afficher en cartes"}
          className="shrink-0"
        >
          {viewMode === "cards" ? (
            <List className="h-4 w-4" aria-hidden />
          ) : (
            <LayoutGrid className="h-4 w-4" aria-hidden />
          )}
        </Button>
      </div>

      {viewMode === "table" ? (
        <div className="rounded-md border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[72px]">Couverture</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead className="hidden sm:table-cell">Auteur</TableHead>
                <TableHead className="w-[100px]">État</TableHead>
                <TableHead className="w-[80px] text-right">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {books.map((book) => {
                const bookSlug = generateBookSlug(book.title, book.author);
                return (
                  <TableRow key={book.id} className="hover:bg-muted/50">
                    <TableCell className="p-2">
                      <Link
                        href={`/books/${bookSlug}`}
                        className="block relative w-12 h-16 shrink-0 overflow-hidden rounded bg-muted"
                        aria-label={`Voir ${book.title}`}
                      >
                        {book.coverUrl ? (
                          <Image
                            src={book.coverUrl}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                            —
                          </div>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/books/${bookSlug}`}
                        className="font-medium text-foreground hover:text-accent-foreground line-clamp-2"
                      >
                        {book.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {book.author}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {statusLabels[book.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {book.rating != null ? formatRating(book.rating) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => {
            const bookSlug = generateBookSlug(book.title, book.author);
            return (
              <Card
                key={book.id}
                className="border-border/60 bg-card/80 backdrop-blur transition hover:shadow-sm"
              >
                <CardHeader className="flex flex-row gap-4">
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
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        Pas de couverture
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <CardTitle className="text-base">
                      <Link
                        href={`/books/${bookSlug}`}
                        className="hover:text-accent-foreground transition-colors line-clamp-2"
                      >
                        {book.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="text-sm line-clamp-1">
                      {book.author}
                    </CardDescription>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {statusLabels[book.status]}
                      </Badge>
                      {book.rating ? (
                        <Badge variant="outline" className="text-xs">
                          {formatRating(book.rating)} / 5
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ProfileRecentBooksSection;
