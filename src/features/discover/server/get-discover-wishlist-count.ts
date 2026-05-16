import db from "@/lib/supabase/db";

export const getDiscoverWishlistCount = async (
  userId: string,
): Promise<number> => {
  if (!userId) return 0;

  const { count } = await db.client
    .from("discover_wishlist")
    .select("book_id", { count: "exact", head: true })
    .eq("user_id", userId);

  return count ?? 0;
};
