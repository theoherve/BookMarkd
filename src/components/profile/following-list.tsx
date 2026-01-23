"use client";

import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFollowing } from "@/server/actions/follow";
import { useEffect, useState } from "react";

type Following = {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  followedAt: string;
};

type FollowingListProps = {
  userId: string;
};

const FollowingList = ({ userId }: FollowingListProps) => {
  const [following, setFollowing] = useState<Following[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFollowing = async () => {
      setIsLoading(true);
      const data = await getFollowing(userId);
      setFollowing(data);
      setIsLoading(false);
    };

    loadFollowing();
  }, [userId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Abonnements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (following.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Abonnements</CardTitle>
          <CardDescription>Vous ne suivez personne pour le moment</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abonnements</CardTitle>
        <CardDescription>
          {following.length} abonnement{following.length > 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {following.map((user) => {
          const avatarInitials = user.displayName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          const profileUrl = user.username
            ? `/profiles/${user.username}`
            : `/profiles/${user.id}`;

          return (
            <Link
              key={user.id}
              href={profileUrl}
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/70 p-3 transition hover:bg-card/90"
              aria-label={`Voir le profil de ${user.displayName}`}
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/50 bg-muted">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.displayName}
                    fill
                    sizes="40px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                    {avatarInitials}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {user.displayName}
                </p>
                {user.bio ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {user.bio}
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default FollowingList;

