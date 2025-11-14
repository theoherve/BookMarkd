"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BookFeedItem } from "@/data/mock-feed";

type BookFeedCardProps = {
  item: BookFeedItem;
};

const BookFeedCard = ({ item }: BookFeedCardProps) => {
  const readersLabel = useMemo(() => {
    if (item.readers.length === 0) {
      return "Pas encore de lecteurs";
    }

    if (item.readers.length === 1) {
      return `${item.readers[0]} l’a lu`;
    }

    if (item.readers.length === 2) {
      return `${item.readers[0]} et ${item.readers[1]} l’ont lu`;
    }

    return `${item.readers[0]}, ${item.readers[1]} et ${
      item.readers.length - 2
    } autres`;
  }, [item.readers]);

  const handleAddToList = () => {
    console.info(`Ajouter ${item.title} à la liste.`);
  };

  const handleRateBook = () => {
    console.info(`Noter ${item.title}.`);
  };

  const handleCommentBook = () => {
    console.info(`Commenter ${item.title}.`);
  };

  return (
    <Card
      role="article"
      aria-label={`Carte livre ${item.title}`}
      className="h-full border-border/80 bg-card/80 transition hover:shadow-md"
    >
      <CardHeader className="space-y-3">
        <Badge
          variant="secondary"
          className="w-fit rounded-full bg-accent/20 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-accent-foreground"
        >
          Highlight
        </Badge>
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold text-foreground">
            {item.title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            par {item.author}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium text-accent-foreground">
          Note moyenne : {item.averageRating.toFixed(1)}/5
        </p>
        <p className="text-sm text-muted-foreground">{readersLabel}</p>
        <p className="text-sm text-muted-foreground">{item.highlight}</p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 pt-0">
        <Button
          variant="secondary"
          aria-label={`Ajouter ${item.title} à votre liste de lecture`}
          onClick={handleAddToList}
        >
          Ajouter à la readlist
        </Button>
        <Button
          variant="outline"
          aria-label={`Noter ${item.title}`}
          onClick={handleRateBook}
        >
          Noter
        </Button>
        <Button
          aria-label={`Commenter ${item.title}`}
          onClick={handleCommentBook}
        >
          Commenter
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BookFeedCard;

