import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {lists.map((list) => {
        const typeBadge = TYPE_BADGE[list.type];
        const displayLabel = list.badgeLabel ?? typeBadge.label;
        const previewBooks = list.books.slice(0, 4);
        const isSemester = list.periodType === "semester";

        return (
          <Link
            key={list.id}
            href={`/tendances/${list.id}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card/80 backdrop-blur transition-shadow hover:shadow-md"
          >
            {/* Mosaic of 4 covers */}
            <div className="grid grid-cols-2 gap-0.5 p-1.5">
              {previewBooks.map((book) => (
                <div
                  key={book.id}
                  className="relative aspect-2/3 overflow-hidden rounded-md bg-muted"
                >
                  {book.externalCoverUrl ? (
                    <Image
                      src={book.externalCoverUrl}
                      alt={book.externalTitle ?? ""}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="80px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-1 text-center text-[8px] text-muted-foreground">
                      {book.externalTitle ?? "—"}
                    </div>
                  )}
                </div>
              ))}
              {/* Fill empty slots if < 4 books */}
              {Array.from({ length: Math.max(0, 4 - previewBooks.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-2/3 rounded-md bg-muted" />
              ))}
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col gap-1.5 px-2.5 pb-2.5 pt-1">
              <div className="flex flex-wrap items-center gap-1">
                <Badge variant="outline" className={`${typeBadge.className} text-[10px] px-1.5 py-0`}>
                  {displayLabel}
                </Badge>
                {isSemester && list.semesterLabel && (
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] px-1.5 py-0">
                    {list.semesterLabel}
                  </Badge>
                )}
              </div>
              <p className="line-clamp-2 text-xs font-semibold leading-tight text-foreground">
                {list.title}
              </p>
              <p className="mt-auto text-[11px] text-muted-foreground">
                {list.books.length} livre{list.books.length > 1 ? "s" : ""}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
