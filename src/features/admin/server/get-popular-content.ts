import { unstable_noStore as noStore } from "next/cache";
import db from "@/lib/supabase/db";

type PopularBook = {
  bookId: string;
  title: string;
  author: string;
  readersCount: number;
};

export const getMostReadBooks = async (
  limit: number = 10,
): Promise<PopularBook[]> => {
  noStore();

  const { data, error } = await db.client
    .from("user_books")
    .select("book_id, books(id, title, author)")
    .eq("status", "finished");

  if (error || !data) return [];

  // Count readers per book
  const counts = new Map<
    string,
    { title: string; author: string; count: number }
  >();
  for (const row of data as unknown as Array<{
    book_id: string;
    books: { id: string; title: string; author: string } | null;
  }>) {
    const book = row.books;
    if (!book) continue;
    const existing = counts.get(book.id);
    if (existing) {
      existing.count++;
    } else {
      counts.set(book.id, { title: book.title, author: book.author, count: 1 });
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([bookId, info]) => ({
      bookId,
      title: info.title,
      author: info.author,
      readersCount: info.count,
    }));
};

type RecentAdminActivity = {
  id: string;
  userId: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
  userName?: string;
};

export const getRecentActivities = async (
  limit: number = 20,
): Promise<RecentAdminActivity[]> => {
  noStore();

  const { data, error } = await db.client
    .from("activities")
    .select("id, user_id, type, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  // Fetch user names
  const userIds = [...new Set(data.map((a: { user_id: string }) => a.user_id))];
  const { data: users } = await db.client
    .from("users")
    .select("id, display_name")
    .in("id", userIds);

  const userMap = new Map<string, string>();
  for (const u of users ?? []) {
    userMap.set(u.id, u.display_name ?? "Utilisateur");
  }

  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as string,
    payload: (row.payload as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    userName: userMap.get(row.user_id as string),
  }));
};
