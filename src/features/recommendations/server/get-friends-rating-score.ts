import db from "@/lib/supabase/db";

export type FriendsRatingEntry = {
  avgRating: number;
  friendCount: number;
};

/**
 * Récupère pour chaque livre la note moyenne des amis (users suivis par viewer)
 * qui ont noté ce livre. Retourne Map<bookId, { avgRating 0–5, friendCount }>.
 * Si viewer n'a aucun follow ou aucun ami n'a noté, Map vide.
 */
export const getFriendsRatingScore = async (
  viewerId: string,
  bookIds: string[],
): Promise<Map<string, FriendsRatingEntry>> => {
  const result = new Map<string, FriendsRatingEntry>();
  if (!viewerId || bookIds.length === 0) return result;

  const { data: follows } = await db.client
    .from("follows")
    .select("following_id")
    .eq("follower_id", viewerId);

  const followingIds = (follows ?? [])
    .map((f) => (f as { following_id: string | null }).following_id)
    .filter((id): id is string => Boolean(id));

  if (followingIds.length === 0) return result;

  const { data: ratings } = await db.client
    .from("user_books")
    .select("book_id, rating")
    .in("user_id", followingIds)
    .in("book_id", bookIds)
    .not("rating", "is", null);

  if (!ratings) return result;

  const agg = new Map<string, { sum: number; count: number }>();
  for (const row of ratings as Array<{ book_id: string | null; rating: number | null }>) {
    if (!row.book_id || typeof row.rating !== "number") continue;
    const entry = agg.get(row.book_id) ?? { sum: 0, count: 0 };
    entry.sum += row.rating;
    entry.count += 1;
    agg.set(row.book_id, entry);
  }

  for (const [bookId, { sum, count }] of agg.entries()) {
    if (count === 0) continue;
    result.set(bookId, {
      avgRating: sum / count,
      friendCount: count,
    });
  }

  return result;
};
