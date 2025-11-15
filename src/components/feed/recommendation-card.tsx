import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AddToReadlistButton from "@/components/search/add-to-readlist-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import RatingForm from "@/components/books/rating-form";
import { generateBookSlug } from "@/lib/slug";
import type { FeedRecommendation } from "@/features/feed/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type RecommendationCardProps = {
  item: FeedRecommendation;
};

const RecommendationCard = ({ item }: RecommendationCardProps) => {
  const sourceLabel =
    item.source === "friends"
      ? "Recommandé par vos amis"
      : item.source === "global"
        ? "Tendances BookMarkd"
        : "Parce que vous avez aimé un titre similaire";

  const bookSlug = generateBookSlug(item.title, item.author);

  return (
    <Card
      role="article"
      tabIndex={0}
      aria-label={`Recommandation ${item.title}`}
      className="space-y-0 border border-dashed border-border/70 bg-card/60 transition hover:border-accent hover:shadow-sm"
    >
      <CardHeader className="space-y-1.5">
        <Badge
          variant="outline"
          className="w-fit rounded-full border-dashed px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-muted-foreground"
        >
          Suggestion
        </Badge>
        <CardTitle className="text-base font-semibold text-foreground">
          <Link
            href={`/books/${bookSlug}`}
            className="hover:text-accent-foreground transition-colors"
            aria-label={`Voir les détails de ${item.title}`}
          >
            {item.title}
          </Link>
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          par {item.author}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {item.reason ?? sourceLabel}
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="w-fit cursor-help rounded-full border-dashed px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-muted-foreground"
              >
                {sourceLabel}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top">
              {item.source === "friends"
                ? "Calcul basé sur vos amis et leurs activités récentes."
                : item.source === "global"
                  ? "Titres les plus populaires sur BookMarkd cette semaine."
                  : "Suggestions générées à partir de vos lectures similaires."}
            </TooltipContent>
          </Tooltip>
          <Badge
            variant="secondary"
            className="w-fit rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent-foreground"
            aria-label={`Affinité estimée ${item.score} pour cent`}
          >
            Affinité estimée : {item.score}%
          </Badge>
        </div>
        {item.friendCount ? (
          <div className="space-y-2 rounded-2xl border border-border/40 bg-card/50 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">
              {item.friendCount} ami·e(s) suivent ce livre :
            </p>
            <ul className="space-y-1">
              {(item.friendHighlights ?? item.friendNames ?? [])
                .slice(0, 3)
                .map((highlight, index) => (
                  <li key={`${item.id}-friend-${index}`}>• {highlight}</li>
                ))}
            </ul>
          </div>
        ) : null}
        {item.tags && item.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {item.tags.slice(0, 4).map((tag) => (
              <Badge
                key={`${item.id}-${tag}`}
                variant="outline"
                className="text-xs font-medium"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-3 border-t border-border/60 bg-card/40 p-4">
        <AddToReadlistButton bookId={item.bookId} disabled={item.viewerHasInReadlist} />
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
          href={`/books/${bookSlug}#reviews`}
          aria-label={`Commenter ${item.title}`}
          className="inline-flex"
        >
          <Button>Commenter</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default RecommendationCard;

