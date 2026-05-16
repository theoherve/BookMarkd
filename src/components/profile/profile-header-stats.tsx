"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, BookOpenCheck, Bookmark, BookX } from "lucide-react";

import FollowListModal from "@/components/profile/follow-list-modal";

export const READLIST_SECTION_ID = "readlist";
export const READLIST_STATUS_PARAM = "status";

type ProfileHeaderStatsProps = {
  userId: string;
  username: string | null;
  booksReadCount: number;
  followersCount: number;
  followingCount: number;
  toReadCount: number;
  readingCount: number;
  dnfCount: number;
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
  dnfCount,
  booksHref,
}: ProfileHeaderStatsProps) => {
  const [openModal, setOpenModal] = useState<"followers" | "following" | null>(
    null,
  );

  const router = useRouter();

  const usernameOrId = username ?? userId;
  const followersHref = `/profiles/${usernameOrId}/followers`;
  const followingHref = `/profiles/${usernameOrId}/following`;

  const goToReadList = (status: "to_read" | "reading" | "finished" | "dnf") => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set(READLIST_STATUS_PARAM, status);
    url.hash = READLIST_SECTION_ID;
    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
    const target = document.getElementById(READLIST_SECTION_ID);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="grid grid-cols-3 items-baseline gap-x-2 text-center text-sm sm:flex sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2">
          <Link
            href={booksHref}
            className="group inline-flex cursor-pointer items-baseline justify-center gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            className="group inline-flex cursor-pointer items-baseline justify-center gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            className="group inline-flex cursor-pointer items-baseline justify-center gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          className="flex flex-wrap items-center justify-center gap-2 text-xs sm:justify-start"
          role="group"
          aria-label="Progression de lecture"
        >
          <button
            type="button"
            onClick={() => goToReadList("to_read")}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-muted-foreground transition-colors hover:border-border hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Voir les ${toReadCount} livre${toReadCount > 1 ? "s" : ""} à lire`}
          >
            <Bookmark className="h-3 w-3" aria-hidden />
            <span className="font-semibold tabular-nums text-foreground">{toReadCount}</span>
            <span>à lire</span>
          </button>
          <button
            type="button"
            onClick={() => goToReadList("reading")}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-muted-foreground transition-colors hover:border-border hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Voir les ${readingCount} livre${readingCount > 1 ? "s" : ""} en cours`}
          >
            <BookOpen className="h-3 w-3" aria-hidden />
            <span className="font-semibold tabular-nums text-foreground">{readingCount}</span>
            <span>en cours</span>
          </button>
          <button
            type="button"
            onClick={() => goToReadList("finished")}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-muted-foreground transition-colors hover:border-border hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Voir les ${booksReadCount} livre${booksReadCount > 1 ? "s" : ""} terminé${booksReadCount > 1 ? "s" : ""}`}
          >
            <BookOpenCheck className="h-3 w-3" aria-hidden />
            <span className="font-semibold tabular-nums text-foreground">{booksReadCount}</span>
            <span>terminé{booksReadCount > 1 ? "s" : ""}</span>
          </button>
          <button
            type="button"
            onClick={() => goToReadList("dnf")}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-muted-foreground transition-colors hover:border-border hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Voir les ${dnfCount} livre${dnfCount > 1 ? "s" : ""} abandonné${dnfCount > 1 ? "s" : ""}`}
          >
            <BookX className="h-3 w-3" aria-hidden />
            <span className="font-semibold tabular-nums text-foreground">{dnfCount}</span>
            <span>abandonné{dnfCount > 1 ? "s" : ""}</span>
          </button>
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
