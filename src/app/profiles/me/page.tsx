import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import BackButton from "@/components/layout/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { getProfileDashboard } from "@/features/profile/server/get-profile-dashboard";
import TopBooksSelector from "@/components/profile/top-books-selector";
import ReadListSection from "@/components/profile/read-list-section";
import ProfileEditButton from "@/components/profile/profile-edit-button";
import UserFeedbacksSection from "@/components/profile/user-feedbacks-section";
import ProfileHeaderStats from "@/components/profile/profile-header-stats";

import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Mon profil",
  description: "Votre profil et vos statistiques de lecture sur BookMarkd.",
  robots: { index: false, follow: false },
};

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
  const usernameOrId = dashboard.username ?? dashboard.userId;
  const booksReadHref = `/profiles/${usernameOrId}/books`;
  const myListsHref = "/profiles/me/lists";

  return (
    <>
      <div className="space-y-10">
        <BackButton ariaLabel="Retour à la page précédente" />

        <header className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm sm:p-8">
          <div className="absolute right-4 top-4 z-10">
            <ProfileEditButton
              initialDisplayName={dashboard.displayName}
              initialBio={dashboard.bio}
              initialAvatarUrl={dashboard.avatarUrl}
              avatarInitials={avatarInitials}
            />
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
            <div className="flex shrink-0 justify-center md:justify-start">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-border bg-muted sm:h-28 sm:w-28">
                {dashboard.avatarUrl ? (
                  <Image
                    src={dashboard.avatarUrl}
                    alt={dashboard.displayName}
                    fill
                    className="object-cover"
                    sizes="(min-width: 640px) 112px, 96px"
                    unoptimized
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-foreground">
                    {avatarInitials}
                  </span>
                )}
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <div className="space-y-1 pr-12">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {dashboard.displayName}
                </h1>
                {dashboard.username ? (
                  <p className="text-sm text-muted-foreground">@{dashboard.username}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">{dashboard.email}</p>
                )}
              </div>

              <ProfileHeaderStats
                userId={dashboard.userId}
                username={dashboard.username}
                booksReadCount={dashboard.readingStats.finished}
                followersCount={dashboard.followersCount}
                followingCount={dashboard.followingCount}
                toReadCount={dashboard.readingStats.toRead}
                readingCount={dashboard.readingStats.reading}
                booksHref={booksReadHref}
              />

              {dashboard.bio ? (
                <p className="max-w-2xl text-sm leading-relaxed text-foreground/80">
                  {dashboard.bio}
                </p>
              ) : (
                <p className="max-w-2xl text-sm italic leading-relaxed text-muted-foreground">
                  Ajoutez une bio depuis votre profil pour partager votre univers littéraire.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="cursor-pointer text-primary-foreground!">
                  <Link href="/lists" aria-label="Gérer vos listes">
                    Gérer mes listes
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="cursor-pointer">
                  <Link href="/lists/create" aria-label="Créer une nouvelle liste">
                    Créer une liste
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="cursor-pointer">
                  <Link href="/feed" aria-label="Voir le fil d'actualité">
                    Voir le feed
                  </Link>
                </Button>
                <Button asChild size="sm" variant="ghost" className="cursor-pointer">
                  <Link href="/search" aria-label="Chercher un nouveau livre">
                    Chercher un livre
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Link
            href={myListsHref}
            className="group block cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Voir vos ${dashboard.ownedLists} liste${dashboard.ownedLists > 1 ? "s" : ""} créée${dashboard.ownedLists > 1 ? "s" : ""}`}
          >
            <Card className="h-full cursor-pointer border-border/60 bg-card/80 backdrop-blur transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Listes créées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-4xl font-semibold tabular-nums text-foreground">
                  {dashboard.ownedLists}
                </p>
                <CardDescription className="text-sm text-muted-foreground">
                  Collections dont vous êtes propriétaire.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link
            href="/lists"
            className="group block cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Voir vos ${dashboard.collaborativeLists} collaboration${dashboard.collaborativeLists > 1 ? "s" : ""}`}
          >
            <Card className="h-full cursor-pointer border-border/60 bg-card/80 backdrop-blur transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Collaborations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-4xl font-semibold tabular-nums text-foreground">
                  {dashboard.collaborativeLists}
                </p>
                <CardDescription className="text-sm text-muted-foreground">
                  Listes auxquelles vous contribuez.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Recommandations reçues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-4xl font-semibold tabular-nums text-foreground">
                {dashboard.recommendationsCount}
              </p>
              <CardDescription className="text-sm text-muted-foreground">
                Suggestions personnalisées prêtes à explorer.
              </CardDescription>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <TopBooksSelector initialTopBooks={dashboard.topBooks} />
        </section>

        <section className="space-y-6">
          <ReadListSection readList={dashboard.readList} />
        </section>

        <section className="space-y-6">
          <UserFeedbacksSection />
        </section>
      </div>
    </>
  );
};

export default ProfilePage;
