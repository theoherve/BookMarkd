import db from "@/lib/supabase/db";

export type BookReader = {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  status: "to_read" | "reading" | "finished";
  rating: number | null;
  hasReview: boolean;
};

export const getBookReaders = async (bookId: string): Promise<BookReader[]> => {
  try {
    const { data: userBooksRows, error: ubError } = await db.client
      .from("user_books")
      .select(
        `
        user_id,
        status,
        rating,
        updated_at,
        user:user_id ( id, username, display_name, avatar_url )
      `,
      )
      .eq("book_id", bookId)
      .order("updated_at", { ascending: false });
    if (ubError) {
      throw ubError;
    }

    // Récupérer les reviews pour vérifier qui a commenté
    const { data: reviewsRows, error: reviewsError } = await db.client
      .from("reviews")
      .select("user_id")
      .eq("book_id", bookId);
    if (reviewsError) {
      throw reviewsError;
    }

    const userBooks = db.toCamel<
      Array<{
        userId: string;
        status: "to_read" | "reading" | "finished";
        rating: number | null;
        user?: {
          id: string;
          username: string | null;
          displayName: string;
          avatarUrl: string | null;
        };
      }>
    >(userBooksRows ?? []);

    const reviews = db.toCamel<Array<{ userId: string }>>(reviewsRows ?? []);
    const reviewersSet = new Set(reviews.map((r) => r.userId));

    return userBooks.map((ub) => ({
      id: ub.user?.id ?? ub.userId,
      username: ub.user?.username ?? null,
      displayName: ub.user?.displayName ?? "Utilisateur·rice",
      avatarUrl: ub.user?.avatarUrl ?? null,
      status: ub.status as "to_read" | "reading" | "finished",
      rating: typeof ub.rating === "number" ? ub.rating : null,
      hasReview: reviewersSet.has(ub.userId),
    }));
  } catch (error) {
    console.error("[books] getBookReaders error:", error);
    return [];
  }
};

