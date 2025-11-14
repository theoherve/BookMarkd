import AppShell from "@/components/layout/app-shell";
import FeedSection from "@/components/feed/feed-section";
import ActivityCard from "@/components/feed/activity-card";
import BookFeedCard from "@/components/feed/book-feed-card";
import RecommendationCard from "@/components/feed/recommendation-card";
import {
  activityFeed,
  bookHighlights,
  personalRecommendations,
} from "@/data/mock-feed";

const HomePage = () => {
  return (
    <AppShell>
      <div className="space-y-10">
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Aujourd’hui
          </p>
          <h1 className="text-3xl font-semibold text-foreground">
            Votre bibliothèque sociale
          </h1>
          <p className="text-sm text-muted-foreground">
            Découvrez ce que lisent vos amis, organisez votre prochaine lecture
            et laissez-vous guider par nos recommandations personnalisées.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <FeedSection
            title="Activités récentes"
            description="Un aperçu instantané de ce que vos amis enregistrent, commentent et terminent."
          >
            {activityFeed.map((activity) => (
              <ActivityCard key={activity.id} item={activity} />
            ))}
          </FeedSection>

          <FeedSection
            title="Lectures des amis"
            description="Les livres qui font vibrer votre cercle lecture cette semaine."
          >
            {bookHighlights.map((book) => (
              <BookFeedCard key={book.id} item={book} />
            ))}
          </FeedSection>

          <FeedSection
            title="Recommandations pour vous"
            description="Suggestions basées sur vos goûts et ceux de vos ami·e·s."
          >
            {personalRecommendations.map((recommendation) => (
              <RecommendationCard key={recommendation.id} item={recommendation} />
            ))}
          </FeedSection>
        </div>
      </div>
    </AppShell>
  );
};

export default HomePage;
