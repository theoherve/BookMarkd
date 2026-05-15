"use server";

import { revalidatePath } from "next/cache";

import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";
import db from "@/lib/supabase/db";
import { recommendBookToUser } from "@/server/actions/recommend";

type ActionResult =
  | { success: true }
  | { success: false; message: string };

type ReadingStatus = "to_read" | "reading" | "finished";
type ReviewVisibility = "public" | "friends" | "private";

const requireSession = async (): Promise<string> => {
  const session = await getCurrentSession();
  const userId = await resolveSessionUserId(session);
  if (!userId) throw new Error("AUTH_REQUIRED");
  return userId;
};

export const addToDiscoverWishlist = async (
  bookId: string,
): Promise<ActionResult> => {
  try {
    const userId = await requireSession();

    const { error } = await db.client
      .from("discover_wishlist")
      .upsert([{ user_id: userId, book_id: bookId }], {
        onConflict: "user_id,book_id",
      });

    if (error) throw error;

    revalidatePath("/discover");
    revalidatePath("/profiles/me");
    return { success: true };
  } catch (err) {
    console.error("[discover] addToDiscoverWishlist error:", err);
    return {
      success: false,
      message: "Impossible d'ajouter ce livre à vos envies.",
    };
  }
};

export const removeFromDiscoverWishlist = async (
  bookId: string,
): Promise<ActionResult> => {
  try {
    const userId = await requireSession();

    const { error } = await db.client
      .from("discover_wishlist")
      .delete()
      .eq("user_id", userId)
      .eq("book_id", bookId);

    if (error) throw error;

    revalidatePath("/discover");
    revalidatePath("/profiles/me");
    return { success: true };
  } catch (err) {
    console.error("[discover] removeFromDiscoverWishlist error:", err);
    return {
      success: false,
      message: "Impossible de retirer ce livre de vos envies.",
    };
  }
};

export type SaveBookFromDiscoverInput = {
  bookId: string;
  status: ReadingStatus;
  rating?: number | null;
  reviewContent?: string | null;
  reviewVisibility?: ReviewVisibility;
  recommendToUserIds?: string[];
};

export const saveBookFromDiscover = async (
  input: SaveBookFromDiscoverInput,
): Promise<ActionResult> => {
  try {
    const userId = await requireSession();
    const {
      bookId,
      status,
      rating = null,
      reviewContent = null,
      reviewVisibility = "public",
      recommendToUserIds = [],
    } = input;

    // 1. Upsert user_books (statut + note)
    const ratedAt = typeof rating === "number" ? new Date().toISOString() : null;
    const { error: ubError } = await db.client
      .from("user_books")
      .upsert(
        [
          {
            user_id: userId,
            book_id: bookId,
            status,
            rating,
            rated_at: ratedAt,
          },
        ],
        { onConflict: "user_id,book_id" },
      );
    if (ubError) throw ubError;

    // 2. Insert review si commentaire fourni
    if (reviewContent && reviewContent.trim().length > 0) {
      const { error: revError } = await db.client.from("reviews").insert([
        {
          user_id: userId,
          book_id: bookId,
          visibility: reviewVisibility,
          content: reviewContent.trim(),
        },
      ]);
      if (revError) throw revError;
    }

    // 3. Recommandations (fire & log mais ne bloque pas si une échoue)
    if (recommendToUserIds.length > 0) {
      const { data: bookRow } = await db.client
        .from("books")
        .select("title, author")
        .eq("id", bookId)
        .maybeSingle();
      const title = (bookRow as { title?: string } | null)?.title ?? "";
      const author = (bookRow as { author?: string } | null)?.author ?? "";
      await Promise.all(
        recommendToUserIds.map((recipientId) =>
          recommendBookToUser(recipientId, bookId, title, author).catch((e) => {
            console.error("[discover] recommend failed", recipientId, e);
          }),
        ),
      );
    }

    // 4. Nettoyer la wishlist (le livre est maintenant rangé)
    await db.client
      .from("discover_wishlist")
      .delete()
      .eq("user_id", userId)
      .eq("book_id", bookId);

    revalidatePath("/discover");
    revalidatePath("/");
    revalidatePath("/profiles/me");
    revalidatePath(`/books/${bookId}`);

    return { success: true };
  } catch (err) {
    if (err instanceof Error && err.message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e.",
      };
    }
    console.error("[discover] saveBookFromDiscover error:", err);
    return {
      success: false,
      message: "Impossible d'enregistrer ce livre.",
    };
  }
};
