import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublishedEditorialList } from "@/types/editorial";

const TYPE_BADGE: Record<PublishedEditorialList["type"], { label: string; className: string }> = {
  bestseller: { label: "Best-seller", className: "bg-amber-100 text-amber-800 border-amber-200" },
  award: { label: "Prix littéraire", className: "bg-purple-100 text-purple-800 border-purple-200" },
  selection: { label: "Sélection", className: "bg-blue-100 text-blue-800 border-blue-200" },
  new_releases: { label: "Nouveautés", className: "bg-green-100 text-green-800 border-green-200" },
};

type Props = {
  lists: PublishedEditorialList[];
};

export const EditorialPreview = ({ lists }: Props) => {
  if (lists.length === 0) return null;

  return (
    <div className="space-y-6">
      {lists.map((list) => {
        const typeBadge = TYPE_BADGE[list.type];
        const displayLabel = list.badgeLabel ?? typeBadge.label;
        const visibleBooks = list.books.slice(0, 10);
        const isSemester = list.periodType === "semester";

        return (
          <Card key={list.id} className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader className="space-y-1.5">
              <div className="flex flex-wrap items-start gap-2">
                <Badge variant="outline" className={typeBadge.className}>
                  {displayLabel}
                </Badge>
                {list.source === "nytimes" && (
                  <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                    NY Times
                  </Badge>
                )}
                {isSemester && list.semesterLabel && (
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    {list.semesterLabel}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg font-semibold text-foreground m-0">
                {list.title}
              </CardTitle>
              {list.description && (
                <CardDescription className="text-sm text-muted-foreground">
                  {list.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-stretch gap-4 overflow-x-auto py-2">
                {visibleBooks.map((book) => {
                  const bookContent = (
                    <div className="flex w-[140px] shrink-0 flex-col gap-2">
                      {/* Cover */}
                      <div className="relative h-[200px] w-full overflow-hidden rounded-lg bg-muted shadow-sm">
                        {book.externalCoverUrl ? (
                          <Image
                            src={book.externalCoverUrl}
                            alt={book.externalTitle ?? ""}
                            fill
                            className="object-cover transition-transform hover:scale-105"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-muted p-2 text-center text-xs text-muted-foreground">
                            {book.externalTitle ?? "—"}
                          </div>
                        )}
                        {/* Semester: show appearances count */}
                        {isSemester && book.appearances != null && (
                          <span className="absolute left-1.5 top-1.5 flex h-auto items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {book.appearances} sem.
                          </span>
                        )}
                        {/* Weekly: show NYT rank */}
                        {!isSemester && book.nytimesRank && (
                          <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-[10px] font-bold text-white">
                            {book.nytimesRank}
                          </span>
                        )}
                      </div>
                      {/* Title + author */}
                      <div className="space-y-0.5">
                        <p className="line-clamp-2 text-xs font-medium leading-tight text-foreground">
                          {book.externalTitle ?? "Sans titre"}
                        </p>
                        <p className="line-clamp-1 text-[11px] text-muted-foreground">
                          {book.externalAuthor ?? ""}
                        </p>
                      </div>
                    </div>
                  );

                  // If linked to a local book, make it a link
                  if (book.bookSlug) {
                    return (
                      <Link key={book.id} href={`/books/${book.bookSlug}`} className="block">
                        {bookContent}
                      </Link>
                    );
                  }

                  return <div key={book.id}>{bookContent}</div>;
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
