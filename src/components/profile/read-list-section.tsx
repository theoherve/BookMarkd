"use client";

import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRating } from "@/lib/utils";
import { generateBookSlug } from "@/lib/slug";
import type { ReadListBook } from "@/features/profile/types";

type ReadListSectionProps = {
  readList: ReadListBook[];
};

const statusLabels: Record<ReadListBook["status"], string> = {
  to_read: "À lire",
  reading: "En cours",
  finished: "Terminé",
};

const ReadListSection = ({ readList }: ReadListSectionProps) => {
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
        <div className="overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex gap-4 min-w-max">
            {readList.slice(0, 20).map((item) => (
              <Link
                key={item.id}
                href={`/books/${generateBookSlug(item.book.title, item.book.author)}`}
                className="flex w-48 min-w-[12rem] flex-shrink-0 flex-col gap-3 rounded-lg border border-border/50 bg-background/60 p-3 transition hover:border-border hover:shadow-md cursor-pointer"
                aria-label={`Voir ${item.book.title}`}
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded bg-muted">
                  {item.book.coverUrl ? (
                    <Image
                      src={item.book.coverUrl}
                      alt={item.book.title}
                      fill
                      sizes="192px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      Pas de couverture
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2">
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
            ))}
          </div>
        </div>
        {readList.length > 20 && (
          <p className="mt-4 text-sm text-muted-foreground text-center">
            Et {readList.length - 20} autre{readList.length - 20 > 1 ? "s" : ""} livre{readList.length - 20 > 1 ? "s" : ""}...
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ReadListSection;

