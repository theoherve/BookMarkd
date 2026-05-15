"use client";

import { useState } from "react";
import Link from "next/link";

import FollowListModal from "@/components/profile/follow-list-modal";

type ProfileStatsBarProps = {
  userId: string;
  username: string | null;
  booksReadCount: number;
  followersCount: number;
  followingCount: number;
  booksHref: string;
};

const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
};

const ProfileStatsBar = ({
  userId,
  username,
  booksReadCount,
  followersCount,
  followingCount,
  booksHref,
}: ProfileStatsBarProps) => {
  const [openModal, setOpenModal] = useState<"followers" | "following" | null>(
    null,
  );

  const usernameOrId = username ?? userId;
  const followersHref = `/profiles/${usernameOrId}/followers`;
  const followingHref = `/profiles/${usernameOrId}/following`;

  return (
    <>
      <div
        className="grid grid-cols-3 divide-x divide-border/60 rounded-2xl border border-border/60 bg-card/80 shadow-sm backdrop-blur"
        role="group"
        aria-label="Statistiques du profil"
      >
        <Link
          href={booksHref}
          className="flex cursor-pointer flex-col items-center gap-1 px-4 py-5 transition-colors hover:bg-accent/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-l-2xl"
          aria-label={`Voir les ${booksReadCount} livres lus`}
        >
          <span className="text-2xl font-semibold tabular-nums text-foreground">
            {formatCount(booksReadCount)}
          </span>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Livres lus
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setOpenModal("followers")}
          className="flex cursor-pointer flex-col items-center gap-1 px-4 py-5 transition-colors hover:bg-accent/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Voir les ${followersCount} abonnés`}
          aria-haspopup="dialog"
        >
          <span className="text-2xl font-semibold tabular-nums text-foreground">
            {formatCount(followersCount)}
          </span>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Abonnés
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOpenModal("following")}
          className="flex flex-col items-center gap-1 px-4 py-5 transition-colors hover:bg-accent/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-2xl"
          aria-label={`Voir les ${followingCount} abonnements`}
          aria-haspopup="dialog"
        >
          <span className="text-2xl font-semibold tabular-nums text-foreground">
            {formatCount(followingCount)}
          </span>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Abonnements
          </span>
        </button>
      </div>

      <FollowListModal
        open={openModal === "followers"}
        onOpenChange={(o) => setOpenModal(o ? "followers" : null)}
        userId={userId}
        mode="followers"
        totalCount={followersCount}
        seeAllHref={followersHref}
      />
      <FollowListModal
        open={openModal === "following"}
        onOpenChange={(o) => setOpenModal(o ? "following" : null)}
        userId={userId}
        mode="following"
        totalCount={followingCount}
        seeAllHref={followingHref}
      />
    </>
  );
};

export default ProfileStatsBar;
