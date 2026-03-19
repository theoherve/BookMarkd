import Link from "next/link";
import type { Metadata } from "next";

import AppShell from "@/components/layout/app-shell";
import BackButton from "@/components/layout/back-button";
import PublicListCard from "@/components/lists/public-list-card";

import { getPublicLists } from "@/features/lists/server/get-public-lists";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Listes publiques",
  description:
    "Explorez les listes de lecture publiques partagées par la communauté BookMarkd.",
};

const ListsPage = async () => {
  const publicLists = await getPublicLists();

  return (
    <AppShell>
      <div className="space-y-8">
        <BackButton ariaLabel="Retour à la page précédente" />
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold text-foreground">
            Listes publiques
          </h1>
          <p className="text-sm text-muted-foreground">
            Découvrez les sélections partagées par la communauté BookMarkd.
            Trouvez l'inspiration pour vos prochaines lectures.
          </p>
        </header>
        {publicLists.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/60 p-10 text-center">
            <h2 className="text-lg font-semibold text-foreground">
              Aucune liste publique pour le moment
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Soyez le premier à partager une liste avec la communauté !
            </p>
            <Link
              href="/lists/create"
              className="mt-6 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground! transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Créer une liste
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {publicLists.map((list) => (
              <PublicListCard key={list.id} list={list} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default ListsPage;
