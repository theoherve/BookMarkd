import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import { getPublicProfile } from "@/features/profile/server/get-public-profile";
import { getFollowers } from "@/server/actions/follow";

type ProfileFollowersPageProps = {
  params: Promise<{ username: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const fallbackAvatarText = (name: string) => {
  const segments = name.trim().split(" ").filter(Boolean);
  if (segments.length === 0) return "BM";
  if (segments.length === 1) return segments[0]!.slice(0, 2).toUpperCase();
  return `${segments[0]!.slice(0, 1)}${segments[segments.length - 1]!.slice(0, 1)}`.toUpperCase();
};

const ProfileFollowersPage = async ({ params }: ProfileFollowersPageProps) => {
  const { username } = await params;
  const profile = await getPublicProfile(username);

  if (!profile) {
    notFound();
  }

  const followers = await getFollowers(profile.id);

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
            Abonnés de {profile.displayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {followers.length} personne{followers.length !== 1 ? "s" : ""} suivent ce profil
          </p>
        </div>

        {followers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun abonné pour le moment.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {followers.map((follower) => {
              const profileUrl = follower.username
                ? `/profiles/${follower.username}`
                : `/profiles/${follower.id}`;
              const avatarInitials = fallbackAvatarText(follower.displayName);

              return (
                <li key={follower.id}>
                  <Link
                    href={profileUrl}
                    className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/80 p-4 transition-colors hover:bg-card hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    aria-label={`Voir le profil de ${follower.displayName}`}
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted">
                      {follower.avatarUrl ? (
                        <Image
                          src={follower.avatarUrl}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                          {avatarInitials}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">
                        {follower.displayName}
                      </p>
                      {follower.username ? (
                        <p className="truncate text-sm text-muted-foreground">
                          @{follower.username}
                        </p>
                      ) : null}
                      {follower.bio ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {follower.bio}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
};

export default ProfileFollowersPage;
