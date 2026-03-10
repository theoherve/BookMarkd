import { unstable_noStore as noStore } from "next/cache";
import db from "@/lib/supabase/db";
import type { AdminBookDetail } from "@/types/admin";

export const getBookDetail = async (bookId: string): Promise<AdminBookDetail | null> => {
  noStore();

  const { data: book, error } = await db.client
    .from("books")
    .select("*")
    .eq("id", bookId)
    .maybeSingle();

  if (error || !book) return null;

  const [tagsResult, readersResult, reviewsResult, viewsResult, ratingsResult] = await Promise.all([
    db.client.from("book_tags").select("tag_id, tags(id, name, slug)").eq("book_id", bookId),
    db.client.from("user_books").select("*", { count: "exact", head: true }).eq("book_id", bookId),
    db.client.from("reviews").select("*", { count: "exact", head: true }).eq("book_id", bookId),
    db.client.from("book_views").select("*", { count: "exact", head: true }).eq("book_id", bookId),
    db.client.from("user_books").select("rating").eq("book_id", bookId).not("rating", "is", null),
  ]);

  const tags = (tagsResult.data ?? []).map((r: Record<string, unknown>) => {
    const tag = r.tags as { id: string; name: string; slug: string } | null;
    return tag ? { id: tag.id, name: tag.name, slug: tag.slug } : null;
  }).filter(Boolean) as { id: string; name: string; slug: string }[];

  // Build rating distribution
  const distMap = new Map<number, number>();
  for (const r of (ratingsResult.data ?? []) as Array<{ rating: number }>) {
    const rounded = Math.round(r.rating);
    distMap.set(rounded, (distMap.get(rounded) ?? 0) + 1);
  }
  const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: distMap.get(rating) ?? 0,
  }));

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    coverUrl: book.cover_url ?? null,
    publicationYear: book.publication_year ?? null,
    averageRating: book.average_rating ?? 0,
    ratingsCount: book.ratings_count ?? 0,
    reviewsCount: reviewsResult.count ?? 0,
    readersCount: readersResult.count ?? 0,
    createdAt: book.created_at,
    summary: book.summary ?? null,
    isbn: book.isbn ?? null,
    publisher: book.publisher ?? null,
    language: book.language ?? null,
    openLibraryId: book.open_library_id ?? null,
    googleBooksId: book.google_books_id ?? null,
    tags,
    ratingDistribution,
    viewsCount: viewsResult.count ?? 0,
  };
};
