import AppShell from "@/components/layout/app-shell";
import FeedClient from "@/components/feed/feed-client";

const HomePage = () => {
  return (
    <AppShell>
      <div className="space-y-12">
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

        <FeedClient />
      </div>
    </AppShell>
  );
};

export default HomePage;
