"use client";

import { ReactNode } from "react";

import ActivityCard from "@/components/feed/activity-card";
import BookFeedCard from "@/components/feed/book-feed-card";
import RecommendationCard from "@/components/feed/recommendation-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeedQuery } from "@/features/feed/api/use-feed-query";

const MAX_ITEMS = 6;

const FeedPreview = () => {
  const { data, isLoading, isError, refetch, isRefetching } = useFeedQuery();

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

  const activities = data.activities.slice(0, MAX_ITEMS);
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
          <PreviewRow>
            {activities.map((activity) => (
              <PreviewItem key={activity.id}>
                <ActivityCard item={activity} />
              </PreviewItem>
            ))}
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

const PreviewRow = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex items-stretch gap-4 overflow-x-auto pb-2">
      {children}
    </div>
  );
};

const PreviewItem = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex h-min-[300px] w-[280px] shrink-0">{children}</div>
  );
};

const EmptyPreview = ({ message }: { message: string }) => (
  <p className="rounded-lg border border-dashed border-border/60 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
    {message}
  </p>
);

const FeedPreviewSkeleton = () => {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, sectionIndex) => (
        <Card key={sectionIndex} className="border-border/60 bg-card/70 backdrop-blur">
          <CardHeader className="space-y-2">
            <Skeleton className="h-4 w-48 rounded-full" />
            <Skeleton className="h-3 w-full max-w-md rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-hidden">
              {[...Array(3)].map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-40 min-w-[280px] rounded-2xl"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FeedPreview;

