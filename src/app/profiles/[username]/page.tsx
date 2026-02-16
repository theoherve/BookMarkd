import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import AppShell from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPublicProfile } from "@/features/profile/server/get-public-profile";
import { getProfileSuggestions } from "@/features/profile/server/get-profile-suggestions";
import FollowRequestButton from "@/components/profile/follow-request-button";
import ProfileCompatibilityCard from "@/components/profile/profile-compatibility-card";
import ProfileSuggestionsSection from "@/components/profile/profile-suggestions-section";
import { getFollowStatus } from "@/server/actions/follow";
import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";
import { generateBookSlug } from "@/lib/slug";

type ProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

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

const PublicProfilePage = async ({ params }: ProfilePageProps) => {
  const { username } = await params;
  const session = await getCurrentSession();
  const viewerId = await resolveSessionUserId(session);

  const profile = await getPublicProfile(username);

  if (!profile) {
    notFound();
  }

  // Ne pas afficher le profil si c'est le viewer lui-même (rediriger vers /profiles/me)
  if (viewerId === profile.id) {
    return null; // Sera géré par un redirect dans le layout ou middleware
  }

  const avatarInitials = fallbackAvatarText(profile.displayName);
  
  // Récupérer le statut de suivi si viewer connecté
  let followStatus: "not_following" | "following" | "request_pending" | "request_rejected" = "not_following";
  if (viewerId) {
    const statusResult = await getFollowStatus(profile.id);
    if ("status" in statusResult) {
      followStatus = statusResult.status;
    }
  }

  const profileSuggestions =
    followStatus === "following" && viewerId
      ? await getProfileSuggestions(
          viewerId,
          profile.id,
          profile.displayName,
        )
      : null;

  return (
    <AppShell>
      <div className="space-y-10">
        <header className="flex flex-col gap-6 rounded-2xl border border-border/60 bg-card/80 p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-border bg-muted">
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-foreground">
                  {avatarInitials}
                </span>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-3xl font-semibold text-foreground">{profile.displayName}</h1>
                {profile.username ? (
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                ) : null}
              </div>
              <p className="max-w-3xl text-sm text-muted-foreground">
                {profile.bio ?? "Aucune bio disponible."}
              </p>
              {viewerId && viewerId !== profile.id ? (
                <div className="flex flex-wrap gap-3">
                  <FollowRequestButton
                    targetUserId={profile.id}
                    initialStatus={followStatus}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <section
          className={
            profileSuggestions
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              : "grid gap-4 md:grid-cols-3"
          }
        >
          <Link
            href={`/profiles/${username}/books`}
            className="block transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
            aria-label={`Voir les ${profile.stats.booksRead} livre${profile.stats.booksRead > 1 ? "s" : ""} lus`}
          >
            <Card className="border-border/60 bg-card/80 backdrop-blur cursor-pointer h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase text-muted-foreground">
                  Livres lus
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-4xl font-semibold text-foreground">{profile.stats.booksRead}</p>
                <CardDescription className="text-sm text-muted-foreground">
                  Lectures terminées
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
          <Link
            href={`/profiles/${username}/followers`}
            className="block transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
            aria-label={`Voir les ${profile.stats.followers} abonné${profile.stats.followers > 1 ? "s" : ""}`}
          >
            <Card className="border-border/60 bg-card/80 backdrop-blur cursor-pointer h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase text-muted-foreground">
                  Abonnés
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-4xl font-semibold text-foreground">{profile.stats.followers}</p>
                <CardDescription className="text-sm text-muted-foreground">
                  Personnes qui suivent ce profil
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
          <Link
            href={`/profiles/${username}/lists`}
            className="block transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
            aria-label={`Voir les ${profile.stats.listsOwned} liste${profile.stats.listsOwned > 1 ? "s" : ""} publiques`}
          >
            <Card className="border-border/60 bg-card/80 backdrop-blur cursor-pointer h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase text-muted-foreground">
                  Listes publiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-4xl font-semibold text-foreground">{profile.stats.listsOwned}</p>
                <CardDescription className="text-sm text-muted-foreground">
                  Collections partagées
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
          {profileSuggestions ? (
            <ProfileCompatibilityCard
              compatibility={profileSuggestions.userCompatibility}
              profileDisplayName={profile.displayName}
            />
          ) : null}
        </section>

        {followStatus === "following" ? (
          <>
            {profile.topBooks.length > 0 ? (
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Top 3 livres</h2>
                <div className="rounded-md border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50 hover:bg-stone-50 dark:bg-stone-900/50 dark:hover:bg-stone-900/50">
                        <TableHead className="w-[60px]">Rang</TableHead>
                        <TableHead className="w-[72px]">Couverture</TableHead>
                        <TableHead>Titre</TableHead>
                        <TableHead className="hidden sm:table-cell">Auteur</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profile.topBooks.map((book) => {
                        const bookSlug = generateBookSlug(book.title, book.author);
                        return (
                          <TableRow key={book.id}>
                            <TableCell className="p-2 text-sm font-medium text-muted-foreground tabular-nums">
                              {book.position}
                            </TableCell>
                            <TableCell className="p-2">
                              <Link
                                href={`/books/${bookSlug}`}
                                className="block relative w-12 h-16 shrink-0 overflow-hidden rounded bg-muted"
                                aria-label={`Voir ${book.title}`}
                              >
                                {book.coverUrl ? (
                                  <Image
                                    src={book.coverUrl}
                                    alt=""
                                    fill
                                    sizes="48px"
                                    className="object-contain"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                    —
                                  </div>
                                )}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/books/${bookSlug}`}
                                className="font-medium text-foreground hover:text-accent-foreground line-clamp-2"
                              >
                                {book.title}
                              </Link>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                              {book.author}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </section>
            ) : null}
            {profileSuggestions && profileSuggestions.suggestions.length > 0 ? (
              <ProfileSuggestionsSection suggestions={profileSuggestions.suggestions} />
            ) : null}
          </>
        ) : null}

        {profile.publicLists.length > 0 ? (
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {profile.publicLists.map((list) => (
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
          </section>
        ) : null}
      </div>
    </AppShell>
  );
};

export default PublicProfilePage;

