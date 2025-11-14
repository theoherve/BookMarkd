"use client";

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
import { formatRelativeTimeFromNow } from "@/lib/datetime";
import type { FeedFriendBook } from "@/features/feed/types";

type BookFeedCardProps = {
  item: FeedFriendBook;
};

const statusLabels: Record<FeedFriendBook["status"], string> = {
  to_read: "Dans la liste à lire",
  reading: "Lecture en cours",
  finished: "Lecture terminée",
};

const BookFeedCard = ({ item }: BookFeedCardProps) => {
  const handleAddToList = () => {
    console.info(`Ajouter ${item.title} à la liste.`);
  };

  const handleRateBook = () => {
    console.info(`Noter ${item.title}.`);
  };

  const handleCommentBook = () => {
    console.info(`Commenter ${item.title}.`);
  };

  const updatedAtLabel = formatRelativeTimeFromNow(item.updatedAt);

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
          {statusLabels[item.status]}
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
        <p className="text-sm text-muted-foreground">
          {item.readerName} — {updatedAtLabel}
        </p>
        {typeof item.averageRating === "number" ? (
          <p className="text-sm font-medium text-accent-foreground">
            Note moyenne : {item.averageRating.toFixed(1)}/5
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          {item.status === "finished"
            ? `${item.readerName} vient d'achever cette lecture.`
            : item.status === "reading"
              ? `${item.readerName} est plongé·e dedans en ce moment.`
              : `${item.readerName} a ajouté ce livre à sa pile à lire.`}
        </p>
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

