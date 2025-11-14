import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ActivityItem } from "@/data/mock-feed";

type ActivityCardProps = {
  item: ActivityItem;
};

const actionLabels: Record<ActivityItem["action"], string> = {
  rated: "a noté",
  commented: "a commenté",
  finished: "a terminé",
};

const ActivityCard = ({ item }: ActivityCardProps) => {
  const ratingStars =
    typeof item.rating === "number"
      ? `${"★".repeat(Math.round(item.rating))}${"☆".repeat(
          5 - Math.round(item.rating),
        )}`
      : null;

  return (
    <Card
      role="article"
      tabIndex={0}
      aria-label={`${item.userName} ${actionLabels[item.action]} ${item.bookTitle}`}
      className="transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent"
    >
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">
            {item.userName}{" "}
            <span className="font-normal text-muted-foreground">
              {actionLabels[item.action]}
            </span>
          </p>
          <CardDescription className="text-xs text-muted-foreground">
            {item.occurredAt}
          </CardDescription>
        </div>
        <CardTitle className="text-base font-semibold text-foreground">
          {item.bookTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {typeof item.rating === "number" ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge
              variant="secondary"
              aria-label={`Note ${item.rating.toFixed(1)} sur 5`}
              className="rounded-full px-3 py-1 text-muted-foreground"
            >
              {item.rating.toFixed(1)}/5
            </Badge>
            <span
              aria-hidden="true"
              className="font-medium tracking-widest text-accent-foreground"
            >
              {ratingStars}
            </span>
          </div>
        ) : null}
        {item.note ? (
          <p className="text-sm text-muted-foreground">{item.note}</p>
        ) : null}
        {!item.note && typeof item.rating !== "number" ? (
          <p className="text-sm text-muted-foreground">
            {item.userName} {actionLabels[item.action]} {item.bookTitle}.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default ActivityCard;

