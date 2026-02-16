import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicProfile } from "@/features/profile/server/get-public-profile";

type ProfileListsPageProps = {
  params: Promise<{ username: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ProfileListsPage = async ({ params }: ProfileListsPageProps) => {
  const { username } = await params;
  const profile = await getPublicProfile(username);

  if (!profile) {
    notFound();
  }

  const { displayName, publicLists } = profile;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <Link
            href={`/profiles/${username}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md w-fit"
            aria-label="Retour au profil"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Retour au profil
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">
            Listes publiques de {displayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {publicLists.length} liste{publicLists.length !== 1 ? "s" : ""} partagée
            {publicLists.length !== 1 ? "s" : ""}
          </p>
        </div>

        {publicLists.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune liste publique pour le moment.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {publicLists.map((list) => (
              <Card
                key={list.id}
                className="border-border/60 bg-card/80 backdrop-blur transition hover:shadow-sm"
              >
                <CardHeader>
                  <CardTitle>
                    <Link
                      href={`/lists/${list.id}`}
                      className="hover:text-accent-foreground transition-colors"
                    >
                      {list.title}
                    </Link>
                  </CardTitle>
                  {list.description ? (
                    <CardDescription className="line-clamp-2">
                      {list.description}
                    </CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {list.itemsCount} livre{list.itemsCount > 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default ProfileListsPage;
