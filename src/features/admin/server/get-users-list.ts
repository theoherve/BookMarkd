import { unstable_noStore as noStore } from "next/cache";
import db from "@/lib/supabase/db";
import type {
  AdminUser,
  AdminUserReview,
  AdminPaginationParams,
  PaginatedResult,
} from "@/types/admin";

export const getUsersList = async (
  params: AdminPaginationParams & {
    isAdmin?: boolean;
    status?: "active" | "disabled";
  },
): Promise<PaginatedResult<AdminUser>> => {
  noStore();

  const {
    page = 1,
    pageSize = 20,
    search,
    sortBy = "created_at",
    sortOrder = "desc",
    isAdmin,
    status,
  } = params;
  const offset = (page - 1) * pageSize;

  let query = db.client
    .from("users")
    .select(
      "id, email, username, display_name, avatar_url, bio, is_admin, disabled_at, created_at, updated_at",
      { count: "exact" },
    );

  if (search) {
    query = query.or(
      `email.ilike.%${search}%,display_name.ilike.%${search}%,username.ilike.%${search}%`,
    );
  }

  if (isAdmin !== undefined) {
    query = query.eq("is_admin", isAdmin);
  }

  if (status === "disabled") {
    query = query.not("disabled_at", "is", null);
  } else if (status === "active") {
    query = query.is("disabled_at", null);
  }

  query = query
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error("[admin/users] Error:", error);
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const rows = data ?? [];
  const userIds = rows.map((r: { id: string }) => r.id);

  // Count books, reviews, lists in parallel
  const [booksData, reviewsData, listsData] = await Promise.all([
    userIds.length > 0
      ? db.client.from("user_books").select("user_id").in("user_id", userIds)
      : Promise.resolve({ data: [] }),
    userIds.length > 0
      ? db.client
          .from("reviews")
          .select(
            "id, user_id, book_id, title, content, created_at, books(id, title, author, cover_url)",
          )
          .in("user_id", userIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    userIds.length > 0
      ? db.client.from("lists").select("owner_id").in("owner_id", userIds)
      : Promise.resolve({ data: [] }),
  ]);

  const booksByUser = new Map<string, number>();
  for (const r of (booksData.data ?? []) as Array<{ user_id: string }>) {
    booksByUser.set(r.user_id, (booksByUser.get(r.user_id) ?? 0) + 1);
  }
  const reviewsByUser = new Map<string, number>();
  const reviewsListByUser = new Map<string, AdminUserReview[]>();
  for (const r of (reviewsData.data ?? []) as unknown as Array<{
    id: string;
    user_id: string;
    book_id: string;
    title: string | null;
    content: string;
    created_at: string;
    books: {
      id: string;
      title: string;
      author: string;
      cover_url: string | null;
    } | null;
  }>) {
    reviewsByUser.set(r.user_id, (reviewsByUser.get(r.user_id) ?? 0) + 1);
    const book = Array.isArray(r.books) ? r.books[0] : r.books;
    if (book) {
      const list = reviewsListByUser.get(r.user_id) ?? [];
      list.push({
        id: r.id,
        title: r.title,
        content: r.content,
        createdAt: r.created_at,
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookCoverUrl: book.cover_url,
      });
      reviewsListByUser.set(r.user_id, list);
    }
  }
  const listsByUser = new Map<string, number>();
  for (const r of (listsData.data ?? []) as Array<{ owner_id: string }>) {
    listsByUser.set(r.owner_id, (listsByUser.get(r.owner_id) ?? 0) + 1);
  }

  const total = count ?? 0;
  const users: AdminUser[] = rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    email: row.email as string,
    username: (row.username as string | null) ?? null,
    displayName: (row.display_name as string) ?? "",
    avatarUrl: (row.avatar_url as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    isAdmin: (row.is_admin as boolean) ?? false,
    disabledAt: (row.disabled_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    booksCount: booksByUser.get(row.id as string) ?? 0,
    reviewsCount: reviewsByUser.get(row.id as string) ?? 0,
    listsCount: listsByUser.get(row.id as string) ?? 0,
    reviews: reviewsListByUser.get(row.id as string) ?? [],
  }));

  return {
    data: users,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};
