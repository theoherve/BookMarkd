import { unstable_noStore as noStore } from "next/cache";
import db from "@/lib/supabase/db";
import type { AdminFeeling, AdminBookRef } from "@/types/admin";

export const getFeelingsList = async (): Promise<AdminFeeling[]> => {
  noStore();

  const { data: feelings, error } = await db.client
    .from("feeling_keywords")
    .select("id, label, slug, source, created_by, created_at")
    .order("label");

  if (error || !feelings) return [];

  const fIds = feelings.map((f: { id: string }) => f.id);
  const { data: usages } =
    fIds.length > 0
      ? await db.client
          .from("user_book_feelings")
          .select("keyword_id, book_id, books(id, title, author, cover_url)")
          .in("keyword_id", fIds)
      : { data: [] };

  const countsByFeeling = new Map<string, number>();
  const booksByFeeling = new Map<string, AdminBookRef[]>();
  const seenBooksByFeeling = new Map<string, Set<string>>();
  for (const u of (usages ?? []) as unknown as Array<{
    keyword_id: string;
    book_id: string;
    books: {
      id: string;
      title: string;
      author: string;
      cover_url: string | null;
    } | null;
  }>) {
    countsByFeeling.set(
      u.keyword_id,
      (countsByFeeling.get(u.keyword_id) ?? 0) + 1,
    );
    const book = Array.isArray(u.books) ? u.books[0] : u.books;
    if (book) {
      const seen = seenBooksByFeeling.get(u.keyword_id) ?? new Set();
      if (!seen.has(book.id)) {
        seen.add(book.id);
        seenBooksByFeeling.set(u.keyword_id, seen);
        const list = booksByFeeling.get(u.keyword_id) ?? [];
        list.push({
          id: book.id,
          title: book.title,
          author: book.author,
          coverUrl: book.cover_url,
        });
        booksByFeeling.set(u.keyword_id, list);
      }
    }
  }

  return feelings.map((f: Record<string, unknown>) => ({
    id: f.id as string,
    label: f.label as string,
    slug: f.slug as string,
    source: f.source as "admin" | "user",
    usageCount: countsByFeeling.get(f.id as string) ?? 0,
    books: booksByFeeling.get(f.id as string) ?? [],
    createdBy: (f.created_by as string | null) ?? null,
    createdAt: f.created_at as string,
  }));
};

export const getOrphanedFeelings = async (): Promise<AdminFeeling[]> => {
  const all = await getFeelingsList();
  return all.filter((f) => f.usageCount === 0);
};
