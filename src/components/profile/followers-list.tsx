"use client";

import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFollowers } from "@/server/actions/follow";
import { useEffect, useState } from "react";

type Follower = {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  followedAt: string;
};

type FollowersListProps = {
  userId: string;
};

const FollowersList = ({ userId }: FollowersListProps) => {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFollowers = async () => {
      setIsLoading(true);
      const data = await getFollowers(userId);
      setFollowers(data);
      setIsLoading(false);
    };

    loadFollowers();
  }, [userId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Abonnés</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (followers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Abonnés</CardTitle>
          <CardDescription>Aucun abonné pour le moment</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abonnés</CardTitle>
        <CardDescription>
          {followers.length} abonné{followers.length > 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {followers.map((follower) => {
          const avatarInitials = follower.displayName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          const profileUrl = follower.username
            ? `/profiles/${follower.username}`
            : `/profiles/${follower.id}`;

          return (
            <Link
              key={follower.id}
              href={profileUrl}
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/70 p-3 transition hover:bg-card/90"
              aria-label={`Voir le profil de ${follower.displayName}`}
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/50 bg-muted">
                {follower.avatarUrl ? (
                  <Image
                    src={follower.avatarUrl}
                    alt={follower.displayName}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                    {avatarInitials}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {follower.displayName}
                </p>
                {follower.bio ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {follower.bio}
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

export default FollowersList;

