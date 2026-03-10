import db from "@/lib/supabase/db";

export const trackBookView = async (params: {
  bookId: string;
  userId?: string | null;
  sessionId?: string;
}): Promise<void> => {
  try {
    await db.client.from("book_views").insert({
      book_id: params.bookId,
      user_id: params.userId ?? null,
      session_id: params.sessionId ?? null,
    });
  } catch (error) {
    console.error("[analytics] trackBookView error:", error);
  }
};
