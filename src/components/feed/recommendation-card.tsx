import Image from "next/image";
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

const fallbackAvatarText = (name: string) => {
  const segments = name.trim().split(" ").filter(Boolean);
  if (segments.length === 0) return "U";
  if (segments.length === 1) {
    return segments[0]!.slice(0, 2).toUpperCase();
  }
  return `${segments[0]!.slice(0, 1)}${segments[segments.length - 1]!.slice(0, 1)}`.toUpperCase();
};

const RecommendationCard = ({ item }: RecommendationCardProps) => {
  const sourceLabel =
    item.source === "friends"
      ? "Recommandé par vos amis"
      : item.source === "global"
        ? "Tendances BookMarkd"
        : "Basé sur vos lectures";

  const bookSlug = generateBookSlug(item.title, item.author);
  const bookHref = `/books/${bookSlug}`;
  
  // Pour les recommandations basées sur les tags (source "similar"), 
  // utiliser la raison qui contient les tags en commun
  const isTagBased = item.source === "similar" && (item.reason?.includes("tag") || item.reason?.includes("Basé sur"));

  return (
    <Card
      role="article"
      tabIndex={0}
      aria-label={`Recommandation ${item.title}`}
      className="flex h-full w-full flex-col space-y-0 border border-dashed border-border/70 bg-card/60 transition hover:border-accent hover:shadow-sm"
    >
      <CardHeader className="shrink-0 space-y-1.5">
        <Badge
          variant="outline"
          className="w-fit rounded-full border-dashed px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-muted-foreground"
        >
          Suggestion
        </Badge>
        <CardTitle className="text-base font-semibold text-foreground">
          <Link
            href={bookHref}
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
      <CardContent className="flex flex-1 flex-col space-y-4 overflow-y-auto">
        <div className="flex flex-1 flex-col space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {item.reason ?? sourceLabel}
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="w-full max-w-full cursor-help rounded-full border-dashed px-3 py-1 text-center text-[11px] uppercase tracking-[0.35em] text-muted-foreground wrap-break-word whitespace-normal"
                  title={sourceLabel}
                >
                  {sourceLabel}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top">
                {item.source === "friends"
                  ? "Calcul basé sur vos amis et leurs activités récentes."
                  : item.source === "global"
                    ? "Titres les plus populaires sur BookMarkd cette semaine."
                    : "Suggestions générées à partir des tags de vos livres terminés, en cours ou dans votre liste de lecture."}
              </TooltipContent>
            </Tooltip>
            <Badge
              variant="secondary"
              className="w-full max-w-full rounded-full bg-accent/20 px-3 py-1 text-center text-xs font-medium text-accent-foreground dark:text-foreground wrap-break-word whitespace-normal"
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
            <div className="space-y-2">
              {isTagBased && (
                <p className="text-xs font-medium text-muted-foreground">
                  Tags communs avec vos lectures :
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {item.tags.slice(0, 4).map((tag) => (
                  <Badge
                    key={`${item.id}-${tag}`}
                    variant={isTagBased ? "secondary" : "outline"}
                    className="text-xs font-medium"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        {item.readers && item.readers.length > 0 ? (
          <div className="mt-auto flex flex-col gap-1.5 border-t border-border/40 pt-2">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Lu par
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {item.readers.map((reader) => {
                const readerHref = reader.username
                  ? `/profiles/${reader.username}`
                  : `/profiles/${reader.id}`;
                const avatarInitials = fallbackAvatarText(reader.displayName);
                return (
                  <Link
                    key={reader.id}
                    href={readerHref}
                    className="flex items-center gap-1.5 rounded-full bg-muted/60 px-2 py-1 transition hover:bg-muted"
                    aria-label={`Voir le profil de ${reader.displayName}`}
                  >
                    <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full border border-border/40 bg-background">
                      {reader.avatarUrl ? (
                        <Image
                          src={reader.avatarUrl}
                          alt=""
                          fill
                          sizes="20px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[9px] font-medium text-muted-foreground">
                          {avatarInitials}
                        </span>
                      )}
                    </div>
                    <span className="line-clamp-1 text-[10px] font-medium text-foreground">
                      {reader.displayName}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex shrink-0 flex-wrap items-center gap-3 border-t border-border/60 bg-card/40 p-4">
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
          href={`${bookHref}#reviews`}
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

