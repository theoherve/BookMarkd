import { unstable_noStore as noStore } from "next/cache";
import db from "@/lib/supabase/db";
import type { AdminTag, AdminBookRef } from "@/types/admin";

export const getTagsList = async (): Promise<AdminTag[]> => {
  noStore();

  const { data: tags, error } = await db.client
    .from("tags")
    .select("id, name, slug, created_at")
    .order("name");

  if (error || !tags) return [];

  const tagIds = tags.map((t: { id: string }) => t.id);
  const { data: bookTags } =
    tagIds.length > 0
      ? await db.client
          .from("book_tags")
          .select("tag_id, book_id, books(id, title, author, cover_url)")
          .in("tag_id", tagIds)
      : { data: [] };

  const countsByTag = new Map<string, number>();
  const booksByTag = new Map<string, AdminBookRef[]>();
  for (const bt of (bookTags ?? []) as unknown as Array<{
    tag_id: string;
    book_id: string;
    books: {
      id: string;
      title: string;
      author: string;
      cover_url: string | null;
    } | null;
  }>) {
    countsByTag.set(bt.tag_id, (countsByTag.get(bt.tag_id) ?? 0) + 1);
    const book = Array.isArray(bt.books) ? bt.books[0] : bt.books;
    if (book) {
      const list = booksByTag.get(bt.tag_id) ?? [];
      list.push({
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.cover_url,
      });
      booksByTag.set(bt.tag_id, list);
    }
  }

  return tags.map((t: Record<string, unknown>) => ({
    id: t.id as string,
    name: t.name as string,
    slug: t.slug as string,
    booksCount: countsByTag.get(t.id as string) ?? 0,
    books: booksByTag.get(t.id as string) ?? [],
    createdAt: t.created_at as string,
  }));
};

export const getOrphanedTags = async (): Promise<AdminTag[]> => {
  const all = await getTagsList();
  return all.filter((t) => t.booksCount === 0);
};
