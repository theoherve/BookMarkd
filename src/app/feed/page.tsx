import { redirect } from "next/navigation";

import AppShell from "@/components/layout/app-shell";
import FeedClient from "@/components/feed/feed-client";
import { Badge } from "@/components/ui/badge";

import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FeedPage = async () => {
  const session = await getCurrentSession();

  const userId = await resolveSessionUserId(session);

  if (!userId) {
    redirect("/login?callbackUrl=/feed");
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <header className="space-y-3">
          <Badge className="w-fit bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Fil d’actualité
          </Badge>
          <h1 className="text-3xl font-semibold text-foreground">Ce que lit votre cercle</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Parcourez les dernières notes, les activités de vos ami·e·s et les recommandations qui vous
            attendent. Votre feed se met à jour en temps réel.
          </p>
        </header>

        <FeedClient />
      </div>
    </AppShell>
  );
};

export default FeedPage;

