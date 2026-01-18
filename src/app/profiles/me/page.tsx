import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";

import AppShell from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { getProfileDashboard } from "@/features/profile/server/get-profile-dashboard";
import TopBooksSelector from "@/components/profile/top-books-selector";
import RecentActivitiesSection from "@/components/profile/recent-activities-section";
import ReadListSection from "@/components/profile/read-list-section";
import ProfileEditButton from "@/components/profile/profile-edit-button";
import FollowRequestsPanel from "@/components/profile/follow-requests-panel";
import UserFeedbacksSection from "@/components/profile/user-feedbacks-section";

import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const fallbackAvatarText = (name: string) => {
  const segments = name.trim().split(" ").filter(Boolean);

  if (segments.length === 0) {
    return "BM";
  }

  if (segments.length === 1) {
    return segments[0]!.slice(0, 2).toUpperCase();
  }

  return `${segments[0]!.slice(0, 1)}${segments[segments.length - 1]!.slice(0, 1)}`.toUpperCase();
};

const ProfilePage = async () => {
  noStore();

  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login?callbackUrl=/profiles/me");
  }

  const userId = await resolveSessionUserId(session);

  if (!userId) {
    redirect("/login?callbackUrl=/profiles/me");
  }

  const dashboard = await getProfileDashboard(userId);
  const avatarInitials = fallbackAvatarText(dashboard.displayName);

  return (
    <AppShell>
      <div className="space-y-10">
        <header className="flex flex-col gap-6 rounded-2xl border border-border/60 bg-card/80 p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <Badge className="w-fit bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Profil
            </Badge>
            <ProfileEditButton
              initialDisplayName={dashboard.displayName}
              initialBio={dashboard.bio}
              initialAvatarUrl={dashboard.avatarUrl}
              avatarInitials={avatarInitials}
            />
          </div>
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-border bg-muted">
              {dashboard.avatarUrl ? (
                <Image
                  src={dashboard.avatarUrl}
                  alt={dashboard.displayName}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-foreground">
                  {avatarInitials}
                </span>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <h1 className="text-3xl font-semibold text-foreground">{dashboard.displayName}</h1>
                <p className="text-sm text-muted-foreground">{dashboard.email}</p>
              </div>
              <p className="max-w-3xl text-sm text-muted-foreground">
                {dashboard.bio ?? "Ajoutez une bio depuis votre profil pour partager votre univers littéraire."}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="text-primary-foreground!">
                  <Link href="/lists" aria-label="Gérer vos listes">
                    Gérer mes listes
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/lists/create" aria-label="Créer une nouvelle liste">
                    Créer une liste
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/feed" aria-label="Voir le fil d'actualité">
                    Voir le feed
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/search" aria-label="Chercher un nouveau livre">
                    Chercher un livre
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <section className="space-y-6">
          <TopBooksSelector initialTopBooks={dashboard.topBooks} />
        </section>

        <section className="space-y-6 md:grid md:grid-cols-[1fr_3fr] md:gap-6 md:space-y-0 md:items-stretch">
          <RecentActivitiesSection activities={dashboard.recentActivities} />
          <ReadListSection readList={dashboard.readList} />
        </section>

        <section className="space-y-6">
          <FollowRequestsPanel />
        </section>

        <section className="space-y-6">
          <UserFeedbacksSection />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase text-muted-foreground">
                Listes créées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-4xl font-semibold text-foreground">{dashboard.ownedLists}</p>
              <CardDescription className="text-sm text-muted-foreground">
                Collections dont vous êtes propriétaire.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase text-muted-foreground">
                Collaborations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-4xl font-semibold text-foreground">{dashboard.collaborativeLists}</p>
              <CardDescription className="text-sm text-muted-foreground">
                Listes auxquelles vous contribuez.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase text-muted-foreground">
                Recommandations reçues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-4xl font-semibold text-foreground">{dashboard.recommendationsCount}</p>
              <CardDescription className="text-sm text-muted-foreground">
                Suggestions personnalisées prêtes à explorer.
              </CardDescription>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground">
                Votre progression de lecture
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Visualisez où vous en êtes et décidez de votre prochaine étape.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1 rounded-lg border border-border/50 bg-background/60 p-4">
                <p className="text-3xl font-semibold text-foreground">{dashboard.readingStats.toRead}</p>
                <p className="text-sm text-muted-foreground">À lire</p>
              </div>
              <div className="space-y-1 rounded-lg border border-border/50 bg-background/60 p-4">
                <p className="text-3xl font-semibold text-foreground">{dashboard.readingStats.reading}</p>
                <p className="text-sm text-muted-foreground">En cours</p>
              </div>
              <div className="space-y-1 rounded-lg border border-border/50 bg-background/60 p-4">
                <p className="text-3xl font-semibold text-foreground">{dashboard.readingStats.finished}</p>
                <p className="text-sm text-muted-foreground">Terminées</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Prochaines étapes</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Quelques actions rapides pour enrichir votre espace BookMarkd.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Invitez un ami à collaborer sur une liste partagée.</p>
              <p>• Ajoutez une note personnalisée à vos lectures en cours.</p>
              <p>• Filtrez le feed par recommandations &quot;Similaires&quot; pour découvrir des pépites.</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
};

export default ProfilePage;

