import Image from "next/image";
import Link from "next/link";

import type { PublicListSummary } from "@/features/lists/types";

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

type PublicListCardProps = {
  list: PublicListSummary;
};

const PublicListCard = ({ list }: PublicListCardProps) => {
  const avatarInitials = list.owner.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="flex h-full flex-col justify-between border-border/60 bg-card/80 backdrop-blur">
      <CardHeader className="gap-3">
        <Badge
          variant="outline"
          className="w-fit text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          Publique
        </Badge>
        <CardTitle className="text-xl font-semibold text-foreground">
          {list.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm text-muted-foreground">
          {list.description ?? "Aucune description fournie pour le moment."}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="rounded-full bg-muted px-3 py-1">
            {list.itemCount} livre{list.itemCount > 1 ? "s" : ""}
          </span>
        </div>
        <Link
          href={`/profiles/${list.owner.id}`}
          className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
            {list.owner.avatarUrl ? (
              <Image
                src={list.owner.avatarUrl}
                alt={list.owner.displayName}
                fill
                sizes="24px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-muted-foreground">
                {avatarInitials}
              </div>
            )}
          </div>
          <span className="truncate">{list.owner.displayName}</span>
        </Link>
      </CardContent>
      <CardFooter>
        <Button
          asChild
          aria-label={`Ouvrir la liste ${list.title}`}
          className="w-full min-h-[48px] sm:min-h-0 text-primary-foreground!"
          size="sm"
        >
          <Link href={`/lists/${list.id}`}>Voir la liste</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PublicListCard;
