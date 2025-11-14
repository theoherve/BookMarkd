import Link from "next/link";
import { redirect } from "next/navigation";

import AppShell from "@/components/layout/app-shell";
import ListSummaryCard from "@/components/lists/list-summary-card";

import { getUserLists } from "@/features/lists/server/get-user-lists";

import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ListsPage = async () => {
  const session = await getCurrentSession();

  const userId = await resolveSessionUserId(session);

  if (!userId) {
    redirect("/login?callbackUrl=/lists");
  }

  const lists = await getUserLists(userId);

  return (
    <AppShell>
      <div className="space-y-8">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold text-foreground">Vos listes</h1>
          <p className="text-sm text-muted-foreground">
            Centralisez vos sélections, partagez des inspirations et gérez vos lectures collaboratives.
          </p>
          <Link
            href="/lists/create"
            className="w-fit rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Créer une nouvelle liste
          </Link>
        </header>
        {lists.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/60 p-10 text-center">
            <h2 className="text-lg font-semibold text-foreground">Aucune liste pour le moment</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Lancez-vous en créant votre première collection personnalisée.
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
            {lists.map((list) => (
              <ListSummaryCard key={list.id} list={list} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default ListsPage;

