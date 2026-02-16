"use client";

import { useMemo } from "react";

import FeedSection from "@/components/feed/feed-section";
import ActivityCard from "@/components/feed/activity-card";
import { condenseActivities } from "@/features/feed/utils/condense-activities";
import BookFeedCard from "@/components/feed/book-feed-card";
import RecommendationCard from "@/components/feed/recommendation-card";
import { BookLoader } from "@/components/ui/book-loader";
import { Button } from "@/components/ui/button";
import { useFeedQuery } from "@/features/feed/api/use-feed-query";
import { useFeedFiltersStore } from "@/stores/feed-filters";

type FeedClientProps = {
  limit?: number;
};

const applyLimit = <T,>(items: T[], limit?: number) => {
  if (!limit) {
    return items;
  }

  return items.slice(0, limit);
};

const FeedClient = ({ limit }: FeedClientProps = {}) => {
  const { data, isLoading, isError, refetch, isRefetching } = useFeedQuery({
    activitiesLimit: 20,
    activitiesOffset: 0,
  });
  const { recommendationSource, setRecommendationSource } =
    useFeedFiltersStore();

  const filteredRecommendations = useMemo(() => {
    if (!data) {
      return [];
    }

    if (recommendationSource === "all") {
      return data.recommendations;
    }

    return applyLimit(
      data.recommendations.filter(
      (item) => item.source === recommendationSource,
      ),
      limit,
    );
  }, [data, limit, recommendationSource]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center py-12">
        <BookLoader size="lg" text="Chargement du feed..." />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
        <p className="text-sm font-medium">
          Impossible de charger le feed pour le moment.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-sm text-muted-foreground">
          Affiner les recommandations
        </p>
        <div className="flex gap-2">
          {(["all", "friends", "global", "similar"] as const).map((source) => (
            <Button
              key={source}
              variant={recommendationSource === source ? "default" : "outline"}
              size="sm"
              onClick={() => setRecommendationSource(source)}
              aria-pressed={recommendationSource === source}
            >
              {source === "all"
                ? "Tous"
                : source === "friends"
                  ? "Amis"
                  : source === "global"
                    ? "Tendances"
                    : "Similaires"}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <FeedSection
          title="Activités récentes"
          description="Ce que votre cercle lecture a partagé ces derniers jours."
        >
          {(() => {
            const condensed = condenseActivities(data.activities);
            return condensed.length === 0 ? (
              <EmptyState message="Aucune activité récente de vos amis. Ajoutez des ami·e·s pour suivre leurs activités !" />
            ) : (
              applyLimit(condensed, limit).map((activity) => (
                <ActivityCard key={activity.id} item={activity} />
              ))
            );
          })()}
        </FeedSection>

        <FeedSection
          title="Lectures des amis"
          description="Les titres qui occupent les bibliothèques de vos ami·e·s."
        >
          {data.friendsBooks.length === 0 ? (
            <EmptyState message="Ajoutez des ami·e·s pour suivre leurs lectures." />
          ) : (
            applyLimit(data.friendsBooks, limit).map((book) => (
              <BookFeedCard key={book.id} item={book} />
            ))
          )}
        </FeedSection>

        <FeedSection
          title="Recommandations pour vous"
          description="Suggestions basées sur vos goûts et ce que lit votre réseau."
        >
          {filteredRecommendations.length === 0 ? (
            <EmptyState message="Aucune recommandation pour ce filtre pour le moment." />
          ) : (
            filteredRecommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                item={recommendation}
              />
            ))
          )}
        </FeedSection>
      </div>
    </div>
  );
};

type EmptyStateProps = {
  message: string;
};

const EmptyState = ({ message }: EmptyStateProps) => (
  <div className="rounded-xl border border-dashed border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
    {message}
  </div>
);

export default FeedClient;

