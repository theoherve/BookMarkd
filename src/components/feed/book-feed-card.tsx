"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AddToReadlistButton from "@/components/search/add-to-readlist-button";
import RatingForm from "@/components/books/rating-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRelativeTimeFromNow } from "@/lib/datetime";
import { formatRating } from "@/lib/utils";
import { generateBookSlug } from "@/lib/slug";
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
  const updatedAtLabel = formatRelativeTimeFromNow(item.updatedAt);
  const bookSlug = generateBookSlug(item.title, item.author);
  const detailHref = `/books/${bookSlug}`;
  const commentHref = `${detailHref}#reviews`;

  return (
    <Card
      role="article"
      aria-label={`Carte livre ${item.title}`}
      className="h-full border-border/80 bg-card/80 transition hover:shadow-md"
    >
      <CardHeader className="space-y-3">
        <Badge
          variant="secondary"
          className="w-fit rounded-full bg-accent/20 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-accent"
        >
          {statusLabels[item.status]}
        </Badge>
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold text-foreground">
            <Link
              href={detailHref}
              className="hover:text-accent-foreground transition-colors"
              aria-label={`Voir les détails de ${item.title}`}
            >
              {item.title}
            </Link>
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
            Note moyenne : {formatRating(item.averageRating)}/5
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
      <CardFooter className="flex flex-wrap items-center gap-3 pt-0">
        <AddToReadlistButton bookId={item.bookId} />
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              aria-label={`Ouvrir la fenêtre pour noter ${item.title}`}
            >
              Noter
            </Button>
          </DialogTrigger>
          <DialogContent aria-label={`Noter ${item.title}`}>
            <DialogHeader>
              <DialogTitle>Noter “{item.title}”</DialogTitle>
            </DialogHeader>
            <RatingForm bookId={item.bookId} />
          </DialogContent>
        </Dialog>
        <Link
          href={commentHref}
          aria-label={`Commenter ${item.title}`}
          className="inline-flex"
        >
          <Button>Commenter</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default BookFeedCard;

