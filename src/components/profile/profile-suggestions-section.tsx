import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import AddToReadlistButton from "@/components/search/add-to-readlist-button";
import { generateBookSlug } from "@/lib/slug";
import type { ProfileSuggestion } from "@/features/profile/server/get-profile-suggestions";

type ProfileSuggestionsSectionProps = {
  suggestions: ProfileSuggestion[];
};

const ProfileSuggestionCard = ({ item }: { item: ProfileSuggestion }) => {
  const bookSlug = generateBookSlug(item.title, item.author);
  const bookHref = `/books/${bookSlug}`;

  return (
    <Card
      role="article"
      className="flex flex-row gap-3 border border-border/60 bg-card/80 p-3 transition hover:border-accent/50 hover:shadow-sm"
    >
      <Link
        href={bookHref}
        className="relative block h-16 w-12 shrink-0 overflow-hidden rounded bg-muted"
        aria-label={`Voir ${item.title}`}
      >
        {item.coverUrl ? (
          <Image
            src={item.coverUrl}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
            —
          </div>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
        <div>
          <Link
            href={bookHref}
            className="line-clamp-1 font-medium text-foreground hover:text-accent-foreground"
          >
            {item.title}
          </Link>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            par {item.author}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
          >
            {item.score}%
          </Badge>
          <p className="line-clamp-2 text-[11px] text-muted-foreground">
            {item.reason}
          </p>
        </div>
        <AddToReadlistButton
          bookId={item.bookId}
          disabled={item.viewerHasInReadlist}
          compact
        />
      </div>
    </Card>
  );
};

const ProfileSuggestionsSection = ({
  suggestions,
}: ProfileSuggestionsSectionProps) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">
        Livres que vous pourriez aimer
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((item) => (
          <ProfileSuggestionCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
};

export default ProfileSuggestionsSection;
