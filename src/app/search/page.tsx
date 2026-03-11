import type { Metadata } from "next";
import { Suspense } from "react";
import AppShell from "@/components/layout/app-shell";
import BackButton from "@/components/layout/back-button";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import SearchClient from "@/components/search/search-client";

export const metadata: Metadata = {
  title: "Recherche",
  description:
    "Trouvez votre prochaine lecture dans le catalogue BookMarkd ou importez depuis Open Library.",
  openGraph: {
    title: "Recherche · BookMarkd",
    description:
      "Trouvez votre prochaine lecture dans le catalogue BookMarkd ou importez depuis Open Library.",
    url: "https://bookmarkd.app/search",
    siteName: "BookMarkd",
    type: "website",
  },
};

const SearchPage = () => {
  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          <BackButton ariaLabel="Retour à la page précédente" />
          <Breadcrumb
            items={[
              { label: "Accueil", href: "/" },
              { label: "Recherche", href: "/search" },
            ]}
          />
        </div>
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
        <Suspense>
          <SearchClient />
        </Suspense>
      </div>
    </AppShell>
  );
};

export default SearchPage;

