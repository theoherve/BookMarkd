import { unstable_noStore as noStore } from "next/cache";
import db from "@/lib/supabase/db";
import type { AdminEditorialList, EditorialListStatus } from "@/types/editorial";

type Params = {
  page?: number;
  pageSize?: number;
  status?: EditorialListStatus | "all";
};

type PaginatedResult = {
  data: AdminEditorialList[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  pendingCount: number; // drafts pending validation
};

export async function getAdminEditorialLists({
  page = 1,
  pageSize = 20,
  status = "all",
}: Params = {}): Promise<PaginatedResult> {
  noStore();

  const offset = (page - 1) * pageSize;

  try {
    let query = db.client
      .from("editorial_lists")
      .select("*, editorial_list_books(count)", { count: "exact" });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    // Count pending drafts (for badge)
    const { count: pendingCount } = await db.client
      .from("editorial_lists")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft");

    const lists: AdminEditorialList[] = (data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      description: (row.description as string | null) ?? null,
      type: row.type as AdminEditorialList["type"],
      source: row.source as AdminEditorialList["source"],
      status: row.status as AdminEditorialList["status"],
      nytimesListName: (row.nytimes_list_name as string | null) ?? null,
      weekDate: (row.week_date as string | null) ?? null,
      periodType: (row.period_type as AdminEditorialList["periodType"]) ?? null,
      semesterLabel: (row.semester_label as string | null) ?? null,
      periodStart: (row.period_start as string | null) ?? null,
      periodEnd: (row.period_end as string | null) ?? null,
      displayOrder: (row.display_order as number) ?? 0,
      badgeLabel: (row.badge_label as string | null) ?? null,
      expiresAt: (row.expires_at as string | null) ?? null,
      publishedAt: (row.published_at as string | null) ?? null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      bookCount: (row.editorial_list_books as { count: number }[])?.[0]?.count ?? 0,
    }));

    const total = count ?? 0;

    return {
      data: lists,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      pendingCount: pendingCount ?? 0,
    };
  } catch (err) {
    console.error("[editorial] getAdminEditorialLists error:", err);
    return { data: [], total: 0, page, pageSize, totalPages: 0, pendingCount: 0 };
  }
}

export async function getAdminEditorialListDetail(listId: string) {
  noStore();

  try {
    const { data: list, error: listError } = await db.client
      .from("editorial_lists")
      .select("*")
      .eq("id", listId)
      .single();

    if (listError || !list) return null;

    const { data: books, error: booksError } = await db.client
      .from("editorial_list_books")
      .select(`
        id, list_id, book_id, position, created_at,
        external_title, external_author, external_isbn, external_cover_url,
        nytimes_rank, nytimes_description,
        appearances, avg_rank, best_rank, aggregate_score,
        books(id, title, author, cover_url)
      `)
      .eq("list_id", listId)
      .order("position", { ascending: true });

    if (booksError) throw booksError;

    return {
      id: list.id as string,
      title: list.title as string,
      description: (list.description as string | null) ?? null,
      type: list.type as AdminEditorialList["type"],
      source: list.source as AdminEditorialList["source"],
      status: list.status as AdminEditorialList["status"],
      nytimesListName: (list.nytimes_list_name as string | null) ?? null,
      weekDate: (list.week_date as string | null) ?? null,
      periodType: (list.period_type as AdminEditorialList["periodType"]) ?? null,
      semesterLabel: (list.semester_label as string | null) ?? null,
      periodStart: (list.period_start as string | null) ?? null,
      periodEnd: (list.period_end as string | null) ?? null,
      displayOrder: (list.display_order as number) ?? 0,
      badgeLabel: (list.badge_label as string | null) ?? null,
      expiresAt: (list.expires_at as string | null) ?? null,
      publishedAt: (list.published_at as string | null) ?? null,
      createdAt: list.created_at as string,
      updatedAt: list.updated_at as string,
      books: (books ?? []).map((b) => {
        const booksRel = b.books as unknown as { id: string; title: string; author: string; cover_url: string | null } | { id: string; title: string; author: string; cover_url: string | null }[] | null;
        const localBook = Array.isArray(booksRel) ? booksRel[0] ?? null : booksRel;
        return {
          id: b.id as string,
          listId: b.list_id as string,
          bookId: (b.book_id as string | null) ?? null,
          bookSlug: null as string | null,
          externalTitle: (b.external_title as string | null) ?? localBook?.title ?? null,
          externalAuthor: (b.external_author as string | null) ?? localBook?.author ?? null,
          externalIsbn: (b.external_isbn as string | null) ?? null,
          externalCoverUrl: (b.external_cover_url as string | null) ?? localBook?.cover_url ?? null,
          nytimesRank: (b.nytimes_rank as number | null) ?? null,
          nytimesDescription: (b.nytimes_description as string | null) ?? null,
          appearances: (b.appearances as number | null) ?? null,
          avgRank: (b.avg_rank as number | null) ?? null,
          bestRank: (b.best_rank as number | null) ?? null,
          aggregateScore: (b.aggregate_score as number | null) ?? null,
          position: b.position as number,
          createdAt: b.created_at as string,
        };
      }),
    };
  } catch (err) {
    console.error("[editorial] getAdminEditorialListDetail error:", err);
    return null;
  }
}

export async function getPendingEditorialListsCount(): Promise<number> {
  noStore();
  try {
    const { count } = await db.client
      .from("editorial_lists")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft");
    return count ?? 0;
  } catch {
    return 0;
  }
}
