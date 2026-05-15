"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, BookOpenCheck, Bookmark } from "lucide-react";

import FollowListModal from "@/components/profile/follow-list-modal";

type ProfileHeaderStatsProps = {
  userId: string;
  username: string | null;
  booksReadCount: number;
  followersCount: number;
  followingCount: number;
  toReadCount: number;
  readingCount: number;
  booksHref: string;
};

const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
};

const ProfileHeaderStats = ({
  userId,
  username,
  booksReadCount,
  followersCount,
  followingCount,
  toReadCount,
  readingCount,
  booksHref,
}: ProfileHeaderStatsProps) => {
  const [openModal, setOpenModal] = useState<"followers" | "following" | null>(
    null,
  );

  const usernameOrId = username ?? userId;
  const followersHref = `/profiles/${usernameOrId}/followers`;
  const followingHref = `/profiles/${usernameOrId}/following`;

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link
            href={booksHref}
            className="group inline-flex cursor-pointer items-baseline gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Voir les ${booksReadCount} livre${booksReadCount > 1 ? "s" : ""} lu${booksReadCount > 1 ? "s" : ""}`}
          >
            <span className="text-base font-semibold tabular-nums text-foreground">
              {formatCount(booksReadCount)}
            </span>
            <span className="text-muted-foreground group-hover:text-foreground">
              livre{booksReadCount > 1 ? "s" : ""} lu{booksReadCount > 1 ? "s" : ""}
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setOpenModal("followers")}
            className="group inline-flex cursor-pointer items-baseline gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Voir les ${followersCount} abonné${followersCount > 1 ? "s" : ""}`}
            aria-haspopup="dialog"
          >
            <span className="text-base font-semibold tabular-nums text-foreground">
              {formatCount(followersCount)}
            </span>
            <span className="text-muted-foreground group-hover:text-foreground">
              abonné{followersCount > 1 ? "s" : ""}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOpenModal("following")}
            className="group inline-flex cursor-pointer items-baseline gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Voir les ${followingCount} abonnement${followingCount > 1 ? "s" : ""}`}
            aria-haspopup="dialog"
          >
            <span className="text-base font-semibold tabular-nums text-foreground">
              {formatCount(followingCount)}
            </span>
            <span className="text-muted-foreground group-hover:text-foreground">
              abonnement{followingCount > 1 ? "s" : ""}
            </span>
          </button>
        </div>

        <div
          className="flex flex-wrap items-center gap-2 text-xs"
          role="group"
          aria-label="Progression de lecture"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-muted-foreground">
            <Bookmark className="h-3 w-3" aria-hidden />
            <span className="font-semibold tabular-nums text-foreground">{toReadCount}</span>
            <span>à lire</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-muted-foreground">
            <BookOpen className="h-3 w-3" aria-hidden />
            <span className="font-semibold tabular-nums text-foreground">{readingCount}</span>
            <span>en cours</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-muted-foreground">
            <BookOpenCheck className="h-3 w-3" aria-hidden />
            <span className="font-semibold tabular-nums text-foreground">{booksReadCount}</span>
            <span>terminé{booksReadCount > 1 ? "s" : ""}</span>
          </span>
        </div>
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

export default ProfileHeaderStats;
