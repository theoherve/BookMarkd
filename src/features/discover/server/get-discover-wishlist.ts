import db from "@/lib/supabase/db";
import { getBookCoverUrl } from "@/lib/storage/covers";
import type { DiscoverWishlistEntry } from "../types";

export const getDiscoverWishlist = async (
  userId: string,
): Promise<DiscoverWishlistEntry[]> => {
  if (!userId) return [];

  const { data, error } = await db.client
    .from("discover_wishlist")
    .select(
      "created_at, book:book_id ( id, slug, title, author, cover_url )",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const result: DiscoverWishlistEntry[] = [];
  for (const row of data as Array<{
    created_at: string;
    book:
      | {
          id: string;
          slug: string | null;
          title: string;
          author: string;
          cover_url: string | null;
        }
      | Array<{
          id: string;
          slug: string | null;
          title: string;
          author: string;
          cover_url: string | null;
        }>
      | null;
  }>) {
    const bookObj = Array.isArray(row.book) ? row.book[0] : row.book;
    if (!bookObj) continue;
    const coverUrl = await getBookCoverUrl(bookObj.id, bookObj.cover_url);
    result.push({
      bookId: bookObj.id,
      slug: bookObj.slug,
      title: bookObj.title,
      author: bookObj.author,
      coverUrl,
      addedAt: row.created_at,
    });
  }

  return result;
};
