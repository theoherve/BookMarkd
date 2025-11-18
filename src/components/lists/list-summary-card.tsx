import Link from "next/link";

import type { ListSummary } from "@/features/lists/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const visibilityLabels: Record<ListSummary["visibility"], string> = {
  public: "Publique",
  unlisted: "Non répertoriée",
  private: "Privée",
};

const roleLabels: Record<ListSummary["viewerRole"], string> = {
  owner: "Propriétaire",
  editor: "Éditeur·rice",
  viewer: "Lecteur·rice",
};

type ListSummaryCardProps = {
  list: ListSummary;
};

const ListSummaryCard = ({ list }: ListSummaryCardProps) => {
  const ariaLabel = `Ouvrir la liste ${list.title}`;
  const visibilityLabel = visibilityLabels[list.visibility];
  const roleLabel = roleLabels[list.viewerRole];

  return (
    <Card className="flex h-full flex-col justify-between border-border/60 bg-card/80 backdrop-blur">
      <CardHeader className="gap-3">
        <Badge variant="outline" className="w-fit text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {visibilityLabel}
        </Badge>
        <CardTitle className="text-xl font-semibold text-foreground">{list.title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {list.description ?? "Aucune description fournie pour le moment."}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="rounded-full bg-muted px-3 py-1">
          {list.itemCount} livre{list.itemCount > 1 ? "s" : ""}
        </span>
        <span className="rounded-full bg-muted px-3 py-1">
          {list.collaboratorCount} collaborateur{list.collaboratorCount > 1 ? "·rice·s" : ""}
        </span>
        <span className="rounded-full bg-muted px-3 py-1">{roleLabel}</span>
      </CardContent>
      <CardFooter>
        <Button
          asChild
          aria-label={ariaLabel}
          className="w-full min-h-[48px] sm:min-h-0"
          size="sm"
        >
          <Link href={`/lists/${list.id}`} tabIndex={0}>
            Voir la liste
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ListSummaryCard;

