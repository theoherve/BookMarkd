"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Trash2, CheckCircle, EyeOff, Archive, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EditorialTypeBadge, EditorialSourceBadge } from "./editorial-list-type-badge";
import {
  publishEditorialList,
  unpublishEditorialList,
  archiveEditorialList,
  removeBookFromEditorialList,
} from "@/server/actions/admin/editorial";
import type { EditorialList, EditorialListBook } from "@/types/editorial";

type Props = {
  list: EditorialList & { books: EditorialListBook[] };
};

export const EditorialListDetail = ({ list }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isSemester = list.periodType === "semester";

  const handlePublish = () => {
    startTransition(async () => { await publishEditorialList(list.id); });
  };

  const handleUnpublish = () => {
    startTransition(async () => { await unpublishEditorialList(list.id); });
  };

  const handleArchive = () => {
    startTransition(async () => { await archiveEditorialList(list.id); });
  };

  const handleRemoveBook = (bookEntryId: string) => {
    setRemovingId(bookEntryId);
    startTransition(async () => {
      await removeBookFromEditorialList(bookEntryId);
      setRemovingId(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <EditorialTypeBadge type={list.type} />
        <EditorialSourceBadge source={list.source} />
        {list.badgeLabel && (
          <Badge variant="outline">{list.badgeLabel}</Badge>
        )}
        {isSemester && list.semesterLabel && (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
            {list.semesterLabel}
          </Badge>
        )}
        <span className="ml-auto flex gap-2">
          {list.status === "draft" && (
            <Button
              size="sm"
              className="text-white bg-green-600 hover:bg-green-700"
              onClick={handlePublish}
              disabled={isPending}
            >
              <CheckCircle className="mr-1.5 size-4" />
              Publier
            </Button>
          )}
          {list.status === "published" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleUnpublish}
                disabled={isPending}
              >
                <EyeOff className="mr-1.5 size-4" />
                Dépublier
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleArchive}
                disabled={isPending}
              >
                <Archive className="mr-1.5 size-4" />
                Archiver
              </Button>
            </>
          )}
          {list.status === "archived" && (
            <Button
              size="sm"
              className="text-white bg-green-600 hover:bg-green-700"
              onClick={handlePublish}
              disabled={isPending}
            >
              <CheckCircle className="mr-1.5 size-4" />
              Republier
            </Button>
          )}
        </span>
      </div>

      {/* Books grid */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">
          Livres{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({list.books.length})
          </span>
        </h2>
        {list.books.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
            Aucun livre dans cette liste.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.books.map((book) => (
              <Card key={book.id} className="relative overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    {/* Cover */}
                    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded bg-muted">
                      {book.externalCoverUrl ? (
                        <Image
                          src={book.externalCoverUrl}
                          alt={book.externalTitle ?? ""}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          —
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      {/* Position / rank display */}
                      <p className="mb-0.5 text-xs font-semibold text-muted-foreground">
                        #{book.position + 1}
                      </p>
                      <p className="line-clamp-2 text-sm font-medium leading-tight">
                        {book.externalTitle ?? "Sans titre"}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {book.externalAuthor ?? "Auteur inconnu"}
                      </p>
                      {/* Semester stats */}
                      {isSemester && book.appearances != null && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">
                            {book.appearances} sem.
                          </Badge>
                          {book.avgRank != null && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-amber-50 text-amber-700 border-amber-200">
                              <BarChart3 className="size-2 mr-0.5" />
                              Moy. {book.avgRank.toFixed(1)}
                            </Badge>
                          )}
                          {book.bestRank != null && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-green-50 text-green-700 border-green-200">
                              Best #{book.bestRank}
                            </Badge>
                          )}
                        </div>
                      )}
                      {/* Weekly rank (legacy / non-semester) */}
                      {!isSemester && book.nytimesRank && (
                        <Badge variant="outline" className="mt-1 text-[10px] bg-gray-50">
                          NYT #{book.nytimesRank}
                        </Badge>
                      )}
                      {book.bookId && (
                        <Badge variant="outline" className="mt-1 text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                          Lié localement
                        </Badge>
                      )}
                    </div>
                  </div>
                  {book.nytimesDescription && (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {book.nytimesDescription}
                    </p>
                  )}
                  {/* Remove button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-6 w-6 text-muted-foreground hover:text-destructive"
                        disabled={isPending && removingId === book.id}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Retirer ce livre ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          &ldquo;{book.externalTitle}&rdquo; sera retiré de la liste. Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveBook(book.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Retirer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
