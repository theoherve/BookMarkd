import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RecommendationItem } from "@/data/mock-feed";

type RecommendationCardProps = {
  item: RecommendationItem;
};

const RecommendationCard = ({ item }: RecommendationCardProps) => {
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
        <p className="text-sm text-muted-foreground">{item.reason}</p>
        <Badge
          variant="secondary"
          className="w-fit rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent-foreground"
          aria-label={`Affinité estimée ${item.matchScore} pour cent`}
        >
          Affinité estimée : {item.matchScore}%
        </Badge>
      </CardContent>
    </Card>
  );
};

export default RecommendationCard;

