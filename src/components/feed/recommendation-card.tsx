import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FeedRecommendation } from "@/features/feed/types";

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
          {item.title}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          par {item.author}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {item.reason ?? sourceLabel}
        </p>
        <Badge
          variant="outline"
          className="w-fit rounded-full border-dashed px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-muted-foreground"
        >
          {sourceLabel}
        </Badge>
        <Badge
          variant="secondary"
          className="w-fit rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent-foreground"
          aria-label={`Affinité estimée ${item.score} pour cent`}
        >
          Affinité estimée : {item.score}%
        </Badge>
      </CardContent>
    </Card>
  );
};

export default RecommendationCard;

