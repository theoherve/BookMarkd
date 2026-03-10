import { unstable_noStore as noStore } from "next/cache";
import db from "@/lib/supabase/db";
import type { AdminBook, AdminPaginationParams, PaginatedResult } from "@/types/admin";

export const getBooksList = async (
  params: AdminPaginationParams & { tag?: string }
): Promise<PaginatedResult<AdminBook>> => {
  noStore();

  const { page = 1, pageSize = 20, search, sortBy = "created_at", sortOrder = "desc" } = params;
  const offset = (page - 1) * pageSize;

  let query = db.client
    .from("books")
    .select("id, title, author, cover_url, publication_year, average_rating, ratings_count, created_at", { count: "exact" });

  if (search) {
    query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
  }

  query = query.order(sortBy, { ascending: sortOrder === "asc" }).range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error("[admin/books] Error:", error);
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const rows = data ?? [];
  const bookIds = rows.map((r: { id: string }) => r.id);

  const [readersData, reviewsData] = await Promise.all([
    bookIds.length > 0
      ? db.client.from("user_books").select("book_id").in("book_id", bookIds)
      : Promise.resolve({ data: [] }),
    bookIds.length > 0
      ? db.client.from("reviews").select("book_id").in("book_id", bookIds)
      : Promise.resolve({ data: [] }),
  ]);

  const readersByBook = new Map<string, number>();
  for (const r of (readersData.data ?? []) as Array<{ book_id: string }>) {
    readersByBook.set(r.book_id, (readersByBook.get(r.book_id) ?? 0) + 1);
  }
  const reviewsByBook = new Map<string, number>();
  for (const r of (reviewsData.data ?? []) as Array<{ book_id: string }>) {
    reviewsByBook.set(r.book_id, (reviewsByBook.get(r.book_id) ?? 0) + 1);
  }

  const total = count ?? 0;
  const books: AdminBook[] = rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    title: row.title as string,
    author: row.author as string,
    coverUrl: (row.cover_url as string | null) ?? null,
    publicationYear: (row.publication_year as number | null) ?? null,
    averageRating: (row.average_rating as number) ?? 0,
    ratingsCount: (row.ratings_count as number) ?? 0,
    reviewsCount: reviewsByBook.get(row.id as string) ?? 0,
    readersCount: readersByBook.get(row.id as string) ?? 0,
    createdAt: row.created_at as string,
  }));

  return { data: books, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
};
