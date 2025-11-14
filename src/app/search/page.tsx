import AppShell from "@/components/layout/app-shell";
import SearchClient from "@/components/search/search-client";

const SearchPage = () => {
  return (
    <AppShell>
      <div className="space-y-8">
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Recherche
          </p>
          <h1 className="text-3xl font-semibold text-foreground">
            Trouvez votre prochaine lecture
          </h1>
          <p className="text-sm text-muted-foreground">
            Explorez le catalogue BookMarkd et enrichissez-le avec les résultats
            d’Open Library pour compléter vos étagères.
          </p>
        </section>
        <SearchClient />
      </div>
    </AppShell>
  );
};

export default SearchPage;

