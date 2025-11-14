"use client";

import Image from "next/image";
import { useTransition } from "react";

import type { ListItem } from "@/features/lists/types";

import { removeListItem } from "@/server/actions/lists";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type ListItemCardProps = {
  listId: string;
  item: ListItem;
  canEdit: boolean;
  positionLabel?: string;
};

const ListItemCard = ({ listId, item, canEdit, positionLabel }: ListItemCardProps) => {
  const [isPending, startTransition] = useTransition();
  const hasAverageRating = typeof item.book.averageRating === "number";
  const averageRating = hasAverageRating ? item.book.averageRating : null;

  const handleRemove = () => {
    startTransition(async () => {
      await removeListItem(listId, item.id);
    });
  };

  return (
    <Card className="grid w-full grid-cols-1 gap-4 border-border/60 bg-card/80 p-4 sm:grid-cols-[120px_1fr_auto]">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted sm:w-28">
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
        <CardTitle className="text-lg font-semibold text-foreground">{item.book.title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {item.book.author}
        </CardDescription>
        <CardContent className="p-0 text-sm text-muted-foreground">
          {hasAverageRating && averageRating !== null
            ? `Note moyenne : ${averageRating.toFixed(1)}/5`
            : "Pas encore de note collective."}
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
          >
            {isPending ? "Suppression..." : "Retirer"}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
};

export default ListItemCard;

