'use server';

import { revalidatePath } from "next/cache";

import { getCurrentSession } from "@/lib/auth/session";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

type ActionResult =
  | { success: true }
  | { success: false; message: string };

const requireSession = async () => {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    throw new Error("AUTH_REQUIRED");
  }
  return session.user.id;
};

const revalidateBook = (bookId: string) => {
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath(`/books/${bookId}`);
};

export const updateReadingStatus = async (
  bookId: string,
  status: "to_read" | "reading" | "finished",
): Promise<ActionResult> => {
  try {
    const userId = await requireSession();
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase
      .from("user_books")
      .upsert(
        [
          {
            user_id: userId,
            book_id: bookId,
            status,
          },
        ],
        { onConflict: "user_id,book_id" },
      );

    if (error) {
      throw error;
    }

    revalidateBook(bookId);
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e pour mettre à jour votre statut.",
      };
    }
    console.error("[book] updateReadingStatus error:", error);
    return {
      success: false,
      message: "Impossible de mettre à jour le statut de lecture.",
    };
  }
};

export const rateBook = async (
  bookId: string,
  rating: number,
): Promise<ActionResult> => {
  try {
    if (rating < 0.5 || rating > 5) {
      return {
        success: false,
        message: "La note doit être comprise entre 0.5 et 5.",
      };
    }
    const userId = await requireSession();
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase
      .from("user_books")
      .upsert(
        [
          {
            user_id: userId,
            book_id: bookId,
            rating,
            rated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "user_id,book_id" },
      );

    if (error) {
      throw error;
    }

    revalidateBook(bookId);
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Connectez-vous avant de noter un livre.",
      };
    }
    console.error("[book] rateBook error:", error);
    return {
      success: false,
      message: "Impossible d’enregistrer votre note.",
    };
  }
};

type ReviewPayload = {
  bookId: string;
  visibility: "public" | "friends" | "private";
  title?: string;
  content: string;
  spoiler?: boolean;
};

export const createReview = async ({
  bookId,
  visibility,
  title,
  content,
  spoiler,
}: ReviewPayload): Promise<ActionResult> => {
  try {
    if (!content) {
      return {
        success: false,
        message: "Veuillez saisir un commentaire.",
      };
    }
    const userId = await requireSession();
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from("reviews").insert({
      user_id: userId,
      book_id: bookId,
      visibility,
      title,
      content,
      spoiler: Boolean(spoiler),
    });

    if (error) {
      throw error;
    }

    revalidateBook(bookId);
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Connectez-vous pour publier un avis.",
      };
    }
    console.error("[book] createReview error:", error);
    return {
      success: false,
      message: "Impossible de publier cet avis.",
    };
  }
};

export const addReviewComment = async (
  reviewId: string,
  content: string,
): Promise<ActionResult> => {
  try {
    if (!content.trim()) {
      return {
        success: false,
        message: "Votre commentaire ne peut pas être vide.",
      };
    }
    const userId = await requireSession();
    const supabase = createSupabaseServiceClient();
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("book_id")
      .eq("id", reviewId)
      .maybeSingle();

    if (reviewError || !review) {
      throw reviewError ?? new Error("REVIEW_NOT_FOUND");
    }

    const { error } = await supabase.from("review_comments").insert({
      review_id: reviewId,
      user_id: userId,
      content,
    });

    if (error) {
      throw error;
    }

    revalidateBook(review.book_id);
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Connectez-vous pour commenter.",
      };
    }
    console.error("[book] addReviewComment error:", error);
    return {
      success: false,
      message: "Impossible d’ajouter ce commentaire.",
    };
  }
};
