import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { ArrowLeft, Globe, Lock, Users } from "lucide-react";
import type { Metadata } from "next";

import AppShell from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserLists } from "@/features/lists/server/get-user-lists";
import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Mes listes",
  description: "Toutes vos listes de lecture sur BookMarkd.",
  robots: { index: false, follow: false },
};

const visibilityMeta = (visibility: string) => {
  switch (visibility) {
    case "public":
      return { label: "Publique", Icon: Globe };
    case "shared":
      return { label: "Partagée", Icon: Users };
    default:
      return { label: "Privée", Icon: Lock };
  }
};

const MyListsPage = async () => {
  noStore();

  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login?callbackUrl=/profiles/me/lists");
  }

  const userId = await resolveSessionUserId(session);
  if (!userId) {
    redirect("/login?callbackUrl=/profiles/me/lists");
  }

  const lists = await getUserLists(userId);
  const ownedLists = lists.filter((l) => l.viewerRole === "owner");
  const collaboratorLists = lists.filter((l) => l.viewerRole !== "owner");

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4">
          <Link
            href="/profiles/me"
            className="inline-flex w-fit items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Retour au profil"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Retour au profil
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Mes listes</h1>
              <p className="text-sm text-muted-foreground">
                {ownedLists.length} liste{ownedLists.length !== 1 ? "s" : ""} créée
                {ownedLists.length !== 1 ? "s" : ""}
                {collaboratorLists.length > 0
                  ? ` · ${collaboratorLists.length} collaboration${collaboratorLists.length !== 1 ? "s" : ""}`
                  : ""}
              </p>
            </div>
            <Button asChild>
              <Link href="/lists/create" aria-label="Créer une nouvelle liste">
                Nouvelle liste
              </Link>
            </Button>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Listes créées
          </h2>
          {ownedLists.length === 0 ? (
            <Card className="border-dashed border-border/60 bg-card/40">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Vous n&apos;avez pas encore créé de liste.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/lists/create">Créer ma première liste</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ownedLists.map((list) => {
                const { label, Icon } = visibilityMeta(list.visibility);
                return (
                  <Link
                    key={list.id}
                    href={`/lists/${list.id}`}
                    className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label={`Ouvrir la liste ${list.title}`}
                  >
                    <Card className="h-full border-border/60 bg-card/80 backdrop-blur transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                      <CardHeader className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="line-clamp-2 text-base font-semibold text-foreground">
                            {list.title}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className="shrink-0 gap-1 text-xs"
                          >
                            <Icon className="h-3 w-3" aria-hidden />
                            {label}
                          </Badge>
                        </div>
                        {list.description ? (
                          <CardDescription className="line-clamp-2 text-sm text-muted-foreground">
                            {list.description}
                          </CardDescription>
                        ) : null}
                      </CardHeader>
                      <CardContent className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="tabular-nums">
                          {list.itemCount} livre{list.itemCount !== 1 ? "s" : ""}
                        </span>
                        {list.collaboratorCount > 0 ? (
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Users className="h-3 w-3" aria-hidden />
                            {list.collaboratorCount}
                          </span>
                        ) : null}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {collaboratorLists.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Collaborations
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {collaboratorLists.map((list) => {
                const { label, Icon } = visibilityMeta(list.visibility);
                return (
                  <Link
                    key={list.id}
                    href={`/lists/${list.id}`}
                    className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label={`Ouvrir la liste ${list.title}`}
                  >
                    <Card className="h-full border-border/60 bg-card/60 backdrop-blur transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                      <CardHeader className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="line-clamp-2 text-base font-semibold text-foreground">
                            {list.title}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className="shrink-0 gap-1 text-xs"
                          >
                            <Icon className="h-3 w-3" aria-hidden />
                            {label}
                          </Badge>
                        </div>
                        {list.description ? (
                          <CardDescription className="line-clamp-2 text-sm text-muted-foreground">
                            {list.description}
                          </CardDescription>
                        ) : null}
                      </CardHeader>
                      <CardContent className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="tabular-nums">
                          {list.itemCount} livre{list.itemCount !== 1 ? "s" : ""}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
};

export default MyListsPage;
