"use server";

import { revalidatePath } from "next/cache";

import { getCurrentSession } from "@/lib/auth/session";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { resolveSessionUserId } from "@/lib/auth/user";

type AddBookToReadlistResult =
  | { success: true }
  | { success: false; message: string };

export const addBookToReadlist = async (
  bookId: string,
): Promise<AddBookToReadlistResult> => {
  const session = await getCurrentSession();

  const userId = await resolveSessionUserId(session);

  if (!userId) {
    return {
      success: false,
      message: "Vous devez être connecté·e pour ajouter un livre.",
    };
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase
      .from("user_books")
      .upsert(
        [
          {
            user_id: userId,
            book_id: bookId,
            status: "to_read",
            rating: null,
            rated_at: null,
          },
        ],
        {
          onConflict: "user_id,book_id",
        },
      );

    if (error) {
      throw error;
    }

    revalidatePath("/"); // feed
    revalidatePath("/search");
    revalidatePath(`/books/${bookId}`);

    return { success: true };
  } catch (error) {
    console.error("[readlist] addBookToReadlist error:", error);
    return {
      success: false,
      message: "Impossible d’ajouter ce livre à votre readlist.",
    };
  }
};

