"use client";

import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BookReader } from "@/features/books/server/get-book-readers";
import { formatRating } from "@/lib/utils";

type BookReadersListProps = {
  readers: BookReader[];
};

const BookReadersList = ({ readers }: BookReadersListProps) => {
  if (readers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lecteurs</CardTitle>
          <CardDescription>
            Aucun utilisateur n&apos;a encore ajouté ce livre à sa liste
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const finishedReaders = readers.filter((r) => r.status === "finished");
  const readingReaders = readers.filter((r) => r.status === "reading");
  const toReadReaders = readers.filter((r) => r.status === "to_read");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lecteurs</CardTitle>
        <CardDescription>
          {readers.length} utilisateur{readers.length > 1 ? "s" : ""} ayant ce livre dans sa liste
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {finishedReaders.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Terminé{finishedReaders.length > 1 ? "s" : ""} ({finishedReaders.length})
            </h3>
            <div className="space-y-2">
              {finishedReaders.map((reader) => {
                const avatarInitials = reader.displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <Link
                    key={reader.id}
                    href={`/profiles/${reader.username ?? reader.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/70 p-3 transition hover:bg-card/90"
                    aria-label={`Voir le profil de ${reader.displayName}`}
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/50 bg-muted">
                      {reader.avatarUrl ? (
                        <Image
                          src={reader.avatarUrl}
                          alt={reader.displayName}
                          fill
                          sizes="40px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                          {avatarInitials}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {reader.displayName}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {reader.rating ? (
                          <Badge variant="outline" className="text-xs">
                            {formatRating(reader.rating)} / 5
                          </Badge>
                        ) : null}
                        {reader.hasReview ? (
                          <Badge variant="secondary" className="text-xs">
                            Avis
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        {readingReaders.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              En cours ({readingReaders.length})
            </h3>
            <div className="space-y-2">
              {readingReaders.map((reader) => {
                const avatarInitials = reader.displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <Link
                    key={reader.id}
                    href={`/profiles/${reader.username ?? reader.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/70 p-3 transition hover:bg-card/90"
                    aria-label={`Voir le profil de ${reader.displayName}`}
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/50 bg-muted">
                      {reader.avatarUrl ? (
                        <Image
                          src={reader.avatarUrl}
                          alt={reader.displayName}
                          fill
                          sizes="40px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                          {avatarInitials}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {reader.displayName}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        {toReadReaders.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              À lire ({toReadReaders.length})
            </h3>
            <div className="space-y-2">
              {toReadReaders.map((reader) => {
                const avatarInitials = reader.displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <Link
                    key={reader.id}
                    href={`/profiles/${reader.username ?? reader.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/70 p-3 transition hover:bg-card/90"
                    aria-label={`Voir le profil de ${reader.displayName}`}
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/50 bg-muted">
                      {reader.avatarUrl ? (
                        <Image
                          src={reader.avatarUrl}
                          alt={reader.displayName}
                          fill
                          sizes="40px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                          {avatarInitials}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {reader.displayName}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default BookReadersList;

