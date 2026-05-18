"use client";

import { ReactNode, useCallback, useRef, useEffect, forwardRef } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Sparkles } from "lucide-react";

import ActivityCard from "@/components/feed/activity-card";
import BookFeedCard from "@/components/feed/book-feed-card";
import RecommendationCard from "@/components/feed/recommendation-card";
import { condenseActivities } from "@/features/feed/utils/condense-activities";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookLoader } from "@/components/ui/book-loader";
import { useInfiniteFeedQuery } from "@/features/feed/api/use-feed-query";

const MAX_ITEMS = 24;

const FeedPreview = () => {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    hasMoreActivities,
    loadMore,
    isLoadingMore,
  } = useInfiniteFeedQuery();
  const activitiesScrollRef = useRef<HTMLDivElement>(null);

  const handleActivitiesScroll = useCallback(() => {
    const el = activitiesScrollRef.current;
    if (!el || !hasMoreActivities || isLoadingMore) return;
    const { scrollLeft, clientWidth, scrollWidth } = el;
    const threshold = 200;
    if (scrollLeft + clientWidth >= scrollWidth - threshold) {
      loadMore();
    }
  }, [hasMoreActivities, isLoadingMore, loadMore]);

  useEffect(() => {
    const el = activitiesScrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleActivitiesScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleActivitiesScroll);
  }, [handleActivitiesScroll]);

  if (isLoading) {
    return <FeedPreviewSkeleton />;
  }

  if (isError || !data) {
    return (
      <Card className="border-destructive/30 bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">Impossible de charger l&apos;aperçu</CardTitle>
          <CardDescription className="text-destructive/80">
            Vérifiez votre connexion et réessayez dans quelques instants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isCommunityMode = data.activitiesSource === "community";

  const condensedActivities = condenseActivities(data.activities);
  const activities = condensedActivities.slice(0, MAX_ITEMS);
  const friendsBooks = data.friendsBooks.slice(0, MAX_ITEMS);
  const recommendations = data.recommendations.slice(0, MAX_ITEMS);
  const trendingBooks = (data.trendingBooks ?? []).slice(0, MAX_ITEMS);
  const topRatedBooks = (data.topRatedBooks ?? []).slice(0, MAX_ITEMS);
  const recentBooks = (data.recentBooks ?? []).slice(0, MAX_ITEMS);

  // En mode communautaire, les sections amis sont remplacées par le contenu global
  const showTrending = isCommunityMode && trendingBooks.length > 0;
  const showTopRated = topRatedBooks.length > 0;
  const showRecent = isCommunityMode && recentBooks.length > 0;

  return (
    <div className="space-y-6">

      {/* ── Activités ──────────────────────────────────────────────────── */}
      <ActivitySection
        title={isCommunityMode ? "Dans la communauté" : "Activités récentes"}
        description={
          isCommunityMode
            ? "Ce que lisent et partagent les lecteur·ices BookMarkd en ce moment."
            : "Les derniers partages de votre cercle de lecture."
        }
        count={activities.length}
        isCommunity={isCommunityMode}
      >
        {activities.length === 0 ? (
          <ActivityEmptyState isCommunity={isCommunityMode} />
        ) : (
          <ScrollFadeWrapper>
            <PreviewRow ref={activitiesScrollRef}>
              {activities.map((activity, index) => (
                <PreviewItem key={activity.id} index={index}>
                  <ActivityCard item={activity} />
                </PreviewItem>
              ))}
              {hasMoreActivities && (
                <PreviewItem index={activities.length}>
                  {isLoadingMore ? (
                    <div className="flex h-full min-h-[220px] w-[280px] shrink-0 items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/50 p-8">
                      <BookLoader size="lg" text="Chargement..." />
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[220px] w-[280px] shrink-0 items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/50 transition-colors hover:border-accent/60 hover:bg-card">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadMore}
                        aria-label="Charger plus d'activités"
                        className="gap-2"
                      >
                        Charger plus
                        <ArrowRight className="size-4" aria-hidden />
                      </Button>
                    </div>
                  )}
                </PreviewItem>
              )}
            </PreviewRow>
          </ScrollFadeWrapper>
        )}
      </ActivitySection>

      {/* ── Livres des amis OU tendances communautaires ─────────────────── */}
      {showTrending ? (
        <PreviewSection
          title="Les plus lus en ce moment"
          description="Les titres que la communauté BookMarkd ne lâche pas."
        >
          <PreviewRow>
            {trendingBooks.map((book) => (
              <PreviewItem key={book.id}>
                <RecommendationCard item={book} />
              </PreviewItem>
            ))}
          </PreviewRow>
        </PreviewSection>
      ) : (
        <PreviewSection
          title="Lectures des amis"
          description="Les livres qui occupent vos ami·e·s cette semaine."
        >
          {friendsBooks.length === 0 ? (
            <EmptyPreview message="Ajoutez des ami·e·s pour suivre leurs bibliothèques." />
          ) : (
            <PreviewRow>
              {friendsBooks.map((book) => (
                <PreviewItem key={book.id}>
                  <BookFeedCard item={book} />
                </PreviewItem>
              ))}
            </PreviewRow>
          )}
        </PreviewSection>
      )}

      {/* ── Nouveautés (mode communautaire uniquement) ───────────────────── */}
      {showRecent && (
        <PreviewSection
          title="Nouveautés"
          description="Les derniers livres ajoutés sur BookMarkd."
        >
          <PreviewRow>
            {recentBooks.map((book) => (
              <PreviewItem key={book.id}>
                <RecommendationCard item={book} />
              </PreviewItem>
            ))}
          </PreviewRow>
        </PreviewSection>
      )}

      {/* ── Recommandations personnalisées OU mieux notés ───────────────── */}
      {showTopRated ? (
        <PreviewSection
          title="Les mieux notés"
          description="Les livres les plus appréciés par la communauté BookMarkd."
        >
          <PreviewRow>
            {topRatedBooks.map((book) => (
              <PreviewItem key={book.id}>
                <RecommendationCard item={book} />
              </PreviewItem>
            ))}
          </PreviewRow>
        </PreviewSection>
      ) : (
        <PreviewSection
          title="Nous vous suggérons"
          description="Des recommandations calculées à partir de vos goûts."
        >
          {recommendations.length === 0 ? (
            <EmptyPreview message="Aucune recommandation pour le moment. Continuez de noter vos lectures !" />
          ) : (
            <PreviewRow>
              {recommendations.map((recommendation) => (
                <PreviewItem key={recommendation.id}>
                  <RecommendationCard item={recommendation} />
                </PreviewItem>
              ))}
            </PreviewRow>
          )}
        </PreviewSection>
      )}
    </div>
  );
};

const PreviewSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => {
  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur">
      <CardHeader className="space-y-1.5">
        <CardTitle className="text-lg font-semibold text-foreground m-0">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
};

const ActivitySection = ({
  title,
  description,
  count,
  isCommunity,
  children,
}: {
  title: string;
  description: string;
  count: number;
  isCommunity: boolean;
  children: ReactNode;
}) => {
  return (
    <Card className="overflow-hidden border-border/60 bg-card/80 backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-foreground"
          >
            <Activity className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="m-0 text-lg font-semibold text-foreground">
                {title}
              </CardTitle>
              {count > 0 && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                  {count}
                </span>
              )}
            </div>
            <CardDescription className="mt-0.5 text-sm text-muted-foreground">
              {description}
            </CardDescription>
          </div>
        </div>
        <Link
          href="/feed"
          aria-label={
            isCommunity
              ? "Voir toute l'activité de la communauté"
              : "Voir tout votre fil"
          }
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent/15 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="hidden sm:inline">Voir tout</span>
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
};

const ScrollFadeWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative -mx-2 px-2">
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-card to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-card to-transparent"
      />
    </div>
  );
};

const PreviewRow = forwardRef<
  HTMLDivElement,
  { children: ReactNode }
>(function PreviewRow({ children }, ref) {
  return (
    <div
      ref={ref}
      className="flex items-stretch gap-4 overflow-x-auto py-2 horizontal-scroll [scroll-snap-type:x_mandatory] [scrollbar-gutter:stable]"
    >
      {children}
    </div>
  );
});

const PreviewItem = ({
  children,
  index = 0,
}: {
  children: ReactNode;
  index?: number;
}) => {
  return (
    <div
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className="flex min-h-[220px] w-[280px] shrink-0 [scroll-snap-align:start] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300 motion-safe:fill-mode-both *:min-w-full"
    >
      {children}
    </div>
  );
};

const ActivityEmptyState = ({ isCommunity }: { isCommunity: boolean }) => (
  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/30 px-6 py-10 text-center">
    <span
      aria-hidden
      className="flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent-foreground"
    >
      <Sparkles className="size-5" />
    </span>
    <div className="space-y-1">
      <p className="text-sm font-semibold text-foreground">
        {isCommunity
          ? "Personne n'a encore partagé"
          : "Pas encore d'activité dans votre cercle"}
      </p>
      <p className="text-sm text-muted-foreground">
        {isCommunity
          ? "Revenez bientôt — la communauté lit en ce moment."
          : "Ajoutez des ami·e·s pour voir leurs lectures apparaître ici."}
      </p>
    </div>
    <Button asChild variant="outline" size="sm" className="mt-1">
      <Link href={isCommunity ? "/discover" : "/profiles"}>
        {isCommunity ? "Découvrir des livres" : "Trouver des lecteur·ices"}
      </Link>
    </Button>
  </div>
);

const EmptyPreview = ({ message }: { message: string }) => (
  <p className="rounded-lg border border-dashed border-border/60 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
    {message}
  </p>
);

const FeedPreviewSkeleton = () => {
  return (
    <div className="flex min-h-[400px] items-center justify-center py-12">
      <BookLoader size="lg" text="Chargement des activités..." />
    </div>
  );
};

export default FeedPreview;
