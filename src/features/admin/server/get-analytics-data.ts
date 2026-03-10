import { unstable_noStore as noStore } from "next/cache";
import db from "@/lib/supabase/db";
import type { ChartDataPoint } from "@/types/admin";

export const getPageViewsOverTime = async (
  days: number = 30,
): Promise<ChartDataPoint[]> => {
  noStore();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await db.client
    .from("page_views")
    .select("created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  const grouped = new Map<string, number>();
  for (const row of data) {
    const date = new Date(row.created_at).toISOString().split("T")[0]!;
    grouped.set(date, (grouped.get(date) ?? 0) + 1);
  }

  const result: ChartDataPoint[] = [];
  const start = new Date(since);
  const end = new Date();
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0]!;
    result.push({ date: dateStr, value: grouped.get(dateStr) ?? 0 });
  }
  return result;
};

export const getTopPages = async (
  days: number = 30,
  limit: number = 10,
): Promise<{ path: string; views: number }[]> => {
  noStore();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await db.client
    .from("page_views")
    .select("path")
    .gte("created_at", since);

  if (error || !data) return [];

  const counts = new Map<string, number>();
  for (const row of data as Array<{ path: string }>) {
    counts.set(row.path, (counts.get(row.path) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([path, views]) => ({ path, views }));
};

export const getTopViewedBooks = async (
  days: number = 30,
  limit: number = 10,
): Promise<{ bookId: string; title: string; views: number }[]> => {
  noStore();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await db.client
    .from("book_views")
    .select("book_id, books(title)")
    .gte("created_at", since);

  if (error || !data) return [];

  const counts = new Map<string, { title: string; count: number }>();
  for (const row of data as unknown as Array<{
    book_id: string;
    books: { title: string } | null;
  }>) {
    const existing = counts.get(row.book_id);
    if (existing) {
      existing.count++;
    } else {
      counts.set(row.book_id, {
        title: row.books?.title ?? "Inconnu",
        count: 1,
      });
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([bookId, info]) => ({
      bookId,
      title: info.title,
      views: info.count,
    }));
};

export const getTopBlogPosts = async (
  days: number = 30,
  limit: number = 10,
): Promise<{ slug: string; views: number }[]> => {
  noStore();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await db.client
    .from("blog_views")
    .select("slug")
    .gte("created_at", since);

  if (error || !data) return [];

  const counts = new Map<string, number>();
  for (const row of data as Array<{ slug: string }>) {
    counts.set(row.slug, (counts.get(row.slug) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([slug, views]) => ({ slug, views }));
};
