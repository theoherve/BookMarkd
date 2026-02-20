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

const fallbackAvatarText = (name: string) => {
  const segments = name.trim().split(" ").filter(Boolean);
  if (segments.length === 0) return "U";
  if (segments.length === 1) {
    return segments[0]!.slice(0, 2).toUpperCase();
  }
  return `${segments[0]!.slice(0, 1)}${segments[segments.length - 1]!.slice(0, 1)}`.toUpperCase();
};

const ProfileSuggestionCard = ({ item }: { item: ProfileSuggestion }) => {
  const bookSlug = generateBookSlug(item.title, item.author);
  const bookHref = `/books/${bookSlug}`;

  // Log pour déboguer
  if (typeof window !== "undefined") {
    console.log(`[ProfileSuggestionCard] Book: ${item.title}, readers count:`, item.readers.length, "readers:", item.readers);
  }

  return (
    <Card
      role="article"
      className="flex flex-col gap-3 border border-border/60 bg-card/80 p-3 transition hover:border-accent/50 hover:shadow-sm"
    >
      <div className="flex flex-row gap-3">
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
      </div>
      {item.readers.length > 0 ? (
        <div className="flex flex-col gap-1.5 border-t border-border/40 pt-2">
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
    </Card>
  );
};

const ProfileSuggestionsSection = ({
  suggestions,
}: ProfileSuggestionsSectionProps) => {
  // Log pour déboguer
  if (typeof window !== "undefined") {
    console.log("[ProfileSuggestionsSection] Received suggestions:", suggestions.length);
    suggestions.forEach((s, index) => {
      console.log(`[ProfileSuggestionsSection] Suggestion ${index}:`, {
        bookId: s.bookId,
        title: s.title,
        readersCount: s.readers.length,
        readers: s.readers,
      });
    });
  }

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
