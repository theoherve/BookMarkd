import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";

import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";
import db from "@/lib/supabase/db";

import { getDiscoverCandidates } from "@/features/discover/server/get-discover-candidates";
import { getDiscoverWishlistCount } from "@/features/discover/server/get-discover-wishlist-count";
import { DiscoverDeck } from "@/features/discover/components/discover-deck";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Découvrir",
  description:
    "Trouvez votre prochaine lecture en swipant les recommandations personnalisées de BookMarkd.",
  robots: { index: false, follow: false },
};

type FollowOption = {
  id: string;
  displayName: string;
  username: string | null;
};

const getFollowOptions = async (userId: string): Promise<FollowOption[]> => {
  const { data } = await db.client
    .from("follows")
    .select("following:following_id ( id, display_name, username )")
    .eq("follower_id", userId);

  if (!data) return [];

  const result: FollowOption[] = [];
  for (const row of data as Array<{
    following:
      | { id: string; display_name: string | null; username: string | null }
      | Array<{ id: string; display_name: string | null; username: string | null }>
      | null;
  }>) {
    const f = Array.isArray(row.following) ? row.following[0] : row.following;
    if (!f) continue;
    result.push({
      id: f.id,
      displayName: f.display_name ?? "Sans nom",
      username: f.username,
    });
  }
  return result.sort((a, b) => a.displayName.localeCompare(b.displayName));
};

const DiscoverPage = async () => {
  const session = await getCurrentSession();
  const userId = await resolveSessionUserId(session);

  if (!userId) {
    redirect("/login?callbackUrl=/discover");
  }

  // Initial batch volontairement petit: la page s'affiche vite et le deck
  // prefetch les suivants via loadMoreDiscoverCandidates quand queue <= 2.
  const [candidates, follows, wishlistCount] = await Promise.all([
    getDiscoverCandidates(userId, 5),
    getFollowOptions(userId),
    getDiscoverWishlistCount(userId),
  ]);

  return (
    <div className="relative -mx-4 -my-6 flex h-[calc(100dvh-9rem)] flex-col overflow-hidden bg-[#fdfaf5] px-4 py-3 dark:bg-[#0f0c0a] md:-my-10 md:h-[calc(100dvh-7rem)] md:py-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-50"
        style={{
          background:
            "radial-gradient(circle at 15% 10%, rgba(194,65,12,0.12), transparent 45%), radial-gradient(circle at 90% 100%, rgba(101,128,106,0.10), transparent 50%)",
        }}
      />

      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <header className="relative shrink-0">
          <h1 className="text-center font-display text-lg font-medium italic leading-tight text-[#1f140d] dark:text-[#f7f1ea] sm:text-xl">
            Votre prochaine lecture
          </h1>
          <Link
            href="/discover/envies"
            aria-label={`Mes envies (${wishlistCount})`}
            className="absolute right-0 top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 rounded-full border border-rose-700/30 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-900 transition hover:bg-rose-100 dark:border-rose-300/30 dark:bg-rose-900/30 dark:text-rose-100 dark:hover:bg-rose-900/50"
          >
            <Heart className="size-3.5 fill-current" />
            {wishlistCount > 0 ? wishlistCount : null}
          </Link>
        </header>

        <DiscoverDeck initialCandidates={candidates} follows={follows} />
      </div>
    </div>
  );
};

export default DiscoverPage;
