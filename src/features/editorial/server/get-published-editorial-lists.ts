import { unstable_noStore as noStore } from "next/cache";
import db from "@/lib/supabase/db";
import type { PublishedEditorialList } from "@/types/editorial";

export async function getPublishedEditorialLists(limit = 4): Promise<PublishedEditorialList[]> {
  noStore();

  try {
    const now = new Date().toISOString();

    const { data: lists, error } = await db.client
      .from("editorial_lists")
      .select("*")
      .eq("status", "published")
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("display_order", { ascending: true })
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    if (!lists || lists.length === 0) return [];

    const listIds = lists.map((l) => l.id as string);

    const { data: books, error: booksError } = await db.client
      .from("editorial_list_books")
      .select("*, books(id, slug, title, author, cover_url)")
      .in("list_id", listIds)
      .order("position", { ascending: true });

    if (booksError) throw booksError;

    return lists.map((list) => {
      const listBooks = (books ?? [])
        .filter((b) => b.list_id === list.id)
        .map((b) => {
          const localBook = b.books as { id: string; slug: string; title: string; author: string; cover_url: string | null } | null;
          return {
            id: b.id as string,
            listId: b.list_id as string,
            bookId: (b.book_id as string | null) ?? null,
            bookSlug: localBook?.slug ?? null,
            externalTitle: (b.external_title as string | null) ?? localBook?.title ?? null,
            externalAuthor: (b.external_author as string | null) ?? localBook?.author ?? null,
            externalIsbn: (b.external_isbn as string | null) ?? null,
            externalCoverUrl: (b.external_cover_url as string | null) ?? localBook?.cover_url ?? null,
            nytimesRank: (b.nytimes_rank as number | null) ?? null,
            nytimesDescription: (b.nytimes_description as string | null) ?? null,
            position: b.position as number,
            createdAt: b.created_at as string,
          };
        });

      return {
        id: list.id as string,
        title: list.title as string,
        description: (list.description as string | null) ?? null,
        type: list.type as PublishedEditorialList["type"],
        source: list.source as PublishedEditorialList["source"],
        status: "published" as const,
        nytimesListName: (list.nytimes_list_name as string | null) ?? null,
        weekDate: (list.week_date as string | null) ?? null,
        displayOrder: (list.display_order as number) ?? 0,
        badgeLabel: (list.badge_label as string | null) ?? null,
        expiresAt: (list.expires_at as string | null) ?? null,
        publishedAt: (list.published_at as string | null) ?? null,
        createdAt: list.created_at as string,
        updatedAt: list.updated_at as string,
        books: listBooks,
      };
    });
  } catch (err) {
    console.error("[editorial] getPublishedEditorialLists error:", err);
    return [];
  }
}
