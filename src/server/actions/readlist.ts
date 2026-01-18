"use server";

import { revalidatePath } from "next/cache";

import { getCurrentSession } from "@/lib/auth/session";
import db from "@/lib/supabase/db";
import { resolveSessionUserId } from "@/lib/auth/user";

type AddBookToReadlistResult =
  | { success: true }
  | { success: false; message: string };

type RemoveBookFromReadlistResult =
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
    // Récupérer l'enregistrement existant pour préserver le rating s'il existe
    const { data: existing, error: existingError } = await db.client
      .from("user_books")
      .select("status, rating")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .maybeSingle();
    if (existingError) {
      throw existingError;
    }

    const statusToSet =
      (existing?.status as "to_read" | "reading" | "finished" | undefined) ??
      "to_read";

    const { error: upsertError } = await db.client
      .from("user_books")
      .upsert(
        [
          {
            user_id: userId,
            book_id: bookId,
            status: statusToSet,
            rating: existing?.rating ?? null,
          },
        ],
        { onConflict: "user_id,book_id" },
      );
    if (upsertError) {
      throw upsertError;
    }

    revalidatePath("/"); // feed
    revalidatePath("/search");
    revalidatePath(`/books/${bookId}`);
    revalidatePath("/profiles/me");

    return { success: true };
  } catch (error) {
    console.error("[readlist] addBookToReadlist error:", error);
    return {
      success: false,
      message: "Impossible d'ajouter ce livre à votre readlist.",
    };
  }
};

export const removeBookFromReadlist = async (
  bookId: string,
): Promise<RemoveBookFromReadlistResult> => {
  const session = await getCurrentSession();

  const userId = await resolveSessionUserId(session);

  if (!userId) {
    return {
      success: false,
      message: "Vous devez être connecté·e pour retirer un livre.",
    };
  }

  try {
    const { error: deleteError } = await db.client
      .from("user_books")
      .delete()
      .eq("user_id", userId)
      .eq("book_id", bookId);

    if (deleteError) {
      throw deleteError;
    }

    revalidatePath("/"); // feed
    revalidatePath("/search");
    revalidatePath(`/books/${bookId}`);
    revalidatePath("/profiles/me");

    return { success: true };
  } catch (error) {
    console.error("[readlist] removeBookFromReadlist error:", error);
    return {
      success: false,
      message: "Impossible de retirer ce livre de votre readlist.",
    };
  }
};

