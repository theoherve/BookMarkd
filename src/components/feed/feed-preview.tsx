"use client";

import { ReactNode, useCallback, useRef, useEffect, forwardRef } from "react";

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
          <CardTitle className="text-destructive">Impossible de charger l’aperçu</CardTitle>
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

  const condensedActivities = condenseActivities(data.activities);
  const activities = condensedActivities.slice(0, MAX_ITEMS);
  const friendsBooks = data.friendsBooks.slice(0, MAX_ITEMS);
  const recommendations = data.recommendations.slice(0, MAX_ITEMS);

  return (
    <div className="space-y-6">
      <PreviewSection
        title="Activités récentes"
        description="Les derniers partages de votre cercle de lecture."
      >
        {activities.length === 0 ? (
          <EmptyPreview message="Aucune activité récente de vos amis. Ajoutez des ami·e·s pour suivre leurs activités !" />
        ) : (
          <PreviewRow ref={activitiesScrollRef}>
            {activities.map((activity) => (
              <PreviewItem key={activity.id}>
                <ActivityCard item={activity} />
              </PreviewItem>
            ))}
            {hasMoreActivities && (
              <PreviewItem>
                {isLoadingMore ? (
                  <div className="flex min-h-[200px] w-[280px] shrink-0 items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/50 p-8">
                    <BookLoader size="lg" text="Chargement..." />
                  </div>
                ) : (
                  <div className="flex min-h-[200px] w-[280px] shrink-0 items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadMore}
                      aria-label="Charger plus d'activités"
                    >
                      Charger plus
                    </Button>
                  </div>
                )}
              </PreviewItem>
            )}
          </PreviewRow>
        )}
      </PreviewSection>

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
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
};

const PreviewRow = forwardRef<
  HTMLDivElement,
  { children: ReactNode }
>(function PreviewRow({ children }, ref) {
  return (
    <div
      ref={ref}
      className="flex items-stretch gap-4 overflow-x-auto py-2"
    >
      {children}
    </div>
  );
});

const PreviewItem = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex h-min-[300px] w-[280px] shrink-0 *:min-w-full">
      {children}
    </div>
  );
};

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

