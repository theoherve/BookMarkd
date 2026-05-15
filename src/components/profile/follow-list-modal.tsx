"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getFollowers, getFollowing } from "@/server/actions/follow";

type FollowUser = {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  followedAt: string;
};

type FollowListModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  mode: "followers" | "following";
  totalCount: number;
  seeAllHref: string;
};

const fallbackInitials = (name: string) => {
  const segments = name.trim().split(" ").filter(Boolean);
  if (segments.length === 0) return "BM";
  if (segments.length === 1) return segments[0]!.slice(0, 2).toUpperCase();
  return `${segments[0]!.slice(0, 1)}${segments[segments.length - 1]!.slice(0, 1)}`.toUpperCase();
};

const FollowListModal = ({
  open,
  onOpenChange,
  userId,
  mode,
  totalCount,
  seeAllHref,
}: FollowListModalProps) => {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      const data =
        mode === "followers"
          ? await getFollowers(userId)
          : await getFollowing(userId);
      setUsers(data);
    });
  }, [open, userId, mode]);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? users.filter(
        (u) =>
          u.displayName.toLowerCase().includes(normalizedQuery) ||
          (u.username?.toLowerCase() ?? "").includes(normalizedQuery),
      )
    : users;

  const title = mode === "followers" ? "Abonnés" : "Abonnements";
  const description =
    mode === "followers"
      ? `${totalCount} personne${totalCount > 1 ? "s" : ""} suivent ce profil`
      : `${totalCount} profil${totalCount > 1 ? "s" : ""} suivi${totalCount > 1 ? "s" : ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="border-b border-border/60 px-5 py-4">
          <DialogTitle className="text-center text-base font-semibold">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher"
              aria-label={`Rechercher dans ${title.toLowerCase()}`}
              className="pl-9"
            />
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-2 pb-2">
          {isPending ? (
            <ul className="space-y-2 p-3" role="status" aria-live="polite">
              {Array.from({ length: 5 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-lg p-2"
                >
                  <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded bg-muted/70" />
                  </div>
                </li>
              ))}
            </ul>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {users.length === 0
                  ? mode === "followers"
                    ? "Aucun abonné pour le moment."
                    : "Aucun abonnement pour le moment."
                  : "Aucun résultat."}
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5 p-2" role="list">
              {filtered.map((user) => {
                const profileUrl = user.username
                  ? `/profiles/${user.username}`
                  : `/profiles/${user.id}`;
                return (
                  <li key={user.id}>
                    <Link
                      href={profileUrl}
                      onClick={() => onOpenChange(false)}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted">
                        {user.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                            {fallbackInitials(user.displayName)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {user.displayName}
                        </p>
                        {user.username ? (
                          <p className="truncate text-xs text-muted-foreground">
                            @{user.username}
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

        <div className="border-t border-border/60 px-5 py-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => onOpenChange(false)}
          >
            <Link href={seeAllHref}>Voir tout</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowListModal;
