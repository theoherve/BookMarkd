import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { Breadcrumb } from "@/components/layout/breadcrumb";
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
import ProfileHeaderStats from "@/components/profile/profile-header-stats";
import { getFollowStatus } from "@/server/actions/follow";
import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";
import { generateBookSlug } from "@/lib/slug";
import { ProfileJsonLd } from "@/components/seo/profile-json-ld";

type ProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const generateMetadata = async ({
  params,
}: ProfilePageProps): Promise<Metadata> => {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) {
    return {};
  }
  const { displayName, stats } = profile;
  const totalBooks =
    stats.booksRead + stats.booksReading + stats.booksToRead;
  const description =
    profile.bio?.trim() ||
    `Profil de ${displayName} sur BookMarkd · ${totalBooks} livre${totalBooks !== 1 ? "s" : ""}, ${stats.followers} abonné${stats.followers !== 1 ? "s" : ""}.`;
  return {
    title: `${displayName} · BookMarkd`,
    description,
    alternates: {
      canonical: `https://bookmarkd.app/profiles/${username}`,
    },
    openGraph: {
      title: `${displayName} · BookMarkd`,
      description,
      type: "profile",
      images: profile.avatarUrl
        ? [{ url: profile.avatarUrl, width: 96, height: 96, alt: displayName }]
        : undefined,
    },
    twitter: {
      card: "summary",
      title: `${displayName} · BookMarkd`,
      description,
      images: profile.avatarUrl ? [profile.avatarUrl] : undefined,
    },
  };
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

const PublicProfilePage = async ({ params }: ProfilePageProps) => {
  const { username } = await params;
  const session = await getCurrentSession();
  const viewerId = await resolveSessionUserId(session);

  const profile = await getPublicProfile(username);

  if (!profile) {
    notFound();
  }

  if (viewerId === profile.id) {
    redirect("/profiles/me");
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
    <>
      <div className="mb-6">
        <Breadcrumb items={[
          { label: "Accueil", href: "/" },
          { label: profile.displayName, href: `/profiles/${username}` },
        ]} />
      </div>
      <ProfileJsonLd
        name={profile.displayName}
        url={`https://bookmarkd.app/profiles/${username}`}
        description={profile.bio}
        image={profile.avatarUrl}
      />
      <div className="space-y-10">
        <header className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
            <div className="flex shrink-0 justify-center md:justify-start">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-border bg-muted sm:h-28 sm:w-28">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.displayName}
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
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {profile.displayName}
                </h1>
                {profile.username ? (
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                ) : null}
              </div>

              <ProfileHeaderStats
                userId={profile.id}
                username={profile.username}
                booksReadCount={profile.stats.booksRead}
                followersCount={profile.stats.followers}
                followingCount={profile.stats.following}
                toReadCount={profile.stats.booksToRead}
                readingCount={profile.stats.booksReading}
                booksHref={`/profiles/${username}/books`}
              />

              <p className="max-w-2xl text-sm leading-relaxed text-foreground/80">
                {profile.bio ?? "Aucune bio disponible."}
              </p>

              {viewerId && viewerId !== profile.id ? (
                <div className="flex flex-wrap gap-2">
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
              ? "grid gap-4 md:grid-cols-2"
              : "grid gap-4"
          }
        >
          <Link
            href={`/profiles/${username}/lists`}
            className="group block cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Voir les ${profile.stats.listsOwned} liste${profile.stats.listsOwned > 1 ? "s" : ""} publiques`}
          >
            <Card className="h-full cursor-pointer border-border/60 bg-card/80 backdrop-blur transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Listes publiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-4xl font-semibold tabular-nums text-foreground">{profile.stats.listsOwned}</p>
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
                                    alt={`Couverture de ${book.title}`}
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
    </>
  );
};

export default PublicProfilePage;

