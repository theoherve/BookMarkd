"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { ListItem } from "@/features/lists/types";

import { formatRating } from "@/lib/utils";
import { generateBookSlug } from "@/lib/slug";
import { removeListItem } from "@/server/actions/lists";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type ListItemCardProps = {
  listId: string;
  item: ListItem;
  canEdit: boolean;
  positionLabel?: string;
};

const ListItemCard = ({ listId, item, canEdit, positionLabel }: ListItemCardProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const hasAverageRating = typeof item.book.averageRating === "number";
  const averageRating = hasAverageRating ? item.book.averageRating : null;
  const bookSlug = generateBookSlug(item.book.title, item.book.author);
  const bookHref = `/books/${bookSlug}`;

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    startTransition(async () => {
      await removeListItem(listId, item.id);
    });
  };

  const handleCardClick = () => {
    router.push(bookHref);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`Voir ${item.book.title} de ${item.book.author}`}
      className="grid w-full cursor-pointer grid-cols-1 gap-4 border-border/60 bg-card/80 p-4 transition hover:border-primary/40 hover:shadow-md sm:grid-cols-[auto_1fr_auto]"
    >
      <div className="relative aspect-2/3 w-24 shrink-0 overflow-hidden border border-border/40 bg-muted sm:w-28">
        {item.book.coverUrl ? (
          <Image
            src={item.book.coverUrl}
            alt={`Couverture de ${item.book.title}`}
            fill
            className="object-cover"
            sizes="112px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Aucune couverture
          </div>
        )}
      </div>
      <CardHeader className="p-0">
        <CardTitle className="text-lg font-semibold text-foreground">
          {item.book.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {item.book.author}
          {item.book.publicationYear ? ` · ${item.book.publicationYear}` : ""}
        </p>
        <CardContent className="p-0 space-y-2">
          {item.book.summary && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {item.book.summary}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {hasAverageRating && averageRating !== null ? (
              <span>{formatRating(averageRating)}/5</span>
            ) : (
              <span>Pas encore de note</span>
            )}
            <span>·</span>
            <span>
              {item.book.readersCount} lecteur{item.book.readersCount > 1 ? "·rice·s" : ""}
            </span>
          </div>
          {item.book.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.book.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {tag.name}
                </Badge>
              ))}
              {item.book.tags.length > 3 && (
                <Badge variant="outline" className="text-xs font-normal">
                  +{item.book.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        {item.note ? (
          <p className="mt-2 rounded-md bg-muted/70 px-3 py-2 text-sm text-foreground">{item.note}</p>
        ) : null}
      </CardHeader>
      <CardFooter className="flex flex-col items-end justify-between gap-2 sm:p-0">
        {positionLabel ? (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {positionLabel}
          </span>
        ) : null}
        {canEdit ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleRemove}
            aria-label={`Retirer ${item.book.title} de la liste`}
            className="cursor-pointer"
          >
            {isPending ? "Suppression..." : "Retirer"}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
};

export default ListItemCard;
