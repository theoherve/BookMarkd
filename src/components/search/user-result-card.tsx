"use client";

import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SearchUser } from "@/features/search/types";
import FollowRequestButton from "@/components/profile/follow-request-button";
import type { FollowStatus } from "@/server/actions/follow";

type UserResultCardProps = {
  user: SearchUser;
  initialFollowStatus?: FollowStatus;
};

const UserResultCard = ({ user, initialFollowStatus = "not_following" }: UserResultCardProps) => {

  const avatarInitials = user.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur transition hover:shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.displayName}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">
                {avatarInitials}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <CardTitle className="truncate text-lg">
              {user.username ? (
                <Link
                  href={`/profiles/${user.username}`}
                  className="hover:text-accent-foreground transition-colors"
                  aria-label={`Voir le profil de ${user.displayName}`}
                >
                  {user.displayName}
                </Link>
              ) : (
                <span className="text-foreground">{user.displayName}</span>
              )}
            </CardTitle>
            {user.bio ? (
              <CardDescription className="line-clamp-2 text-sm">
                {user.bio}
              </CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {user.stats.followers} abonné{user.stats.followers > 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {user.stats.booksRead} livre{user.stats.booksRead > 1 ? "s" : ""} lu{user.stats.booksRead > 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="flex gap-2">
          {user.username ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex-1"
              aria-label={`Voir le profil de ${user.displayName}`}
            >
              <Link href={`/profiles/${user.username}`}>Voir le profil</Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              aria-label={`Profil indisponible pour ${user.displayName}`}
              disabled
            >
              Profil indisponible
            </Button>
          )}
          <FollowRequestButton
            targetUserId={user.id}
            initialStatus={initialFollowStatus}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default UserResultCard;

