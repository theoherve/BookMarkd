import db from "@/lib/supabase/db";

type ActivityType =
  | "rating"
  | "review"
  | "status_change"
  | "list_update"
  | "follow";

type ActivityPayload = {
  book_id?: string;
  book_title?: string;
  rating?: number;
  note?: string;
  review_snippet?: string;
  status_note?: string;
  list_id?: string;
  list_title?: string;
  [key: string]: unknown;
};

/**
 * Crée une activité dans la base de données
 */
export const createActivity = async (
  userId: string,
  type: ActivityType,
  payload: ActivityPayload
): Promise<void> => {
  try {
    await db.client.from("activities").insert([
      {
        user_id: userId,
        type,
        payload,
      },
    ]);
  } catch (error) {
    // Ne pas faire échouer l'opération principale si la création d'activité échoue
    console.error("[activities] createActivity error:", error);
  }
};
