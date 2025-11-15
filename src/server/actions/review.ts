"use server";

import { revalidatePath } from "next/cache";

import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";
import db from "@/lib/supabase/db";

type ActionResult =
  | { success: true }
  | { success: false; message: string };

const requireSession = async () => {
  const session = await getCurrentSession();
  const userId = await resolveSessionUserId(session);
  if (!userId) {
    throw new Error("AUTH_REQUIRED");
  }
  return userId;
};

export const likeReview = async (reviewId: string): Promise<ActionResult> => {
  try {
    const userId = await requireSession();

    // Vérifier que la review existe
    const { data: review, error: reviewError } = await db.client
      .from("reviews")
      .select("book_id")
      .eq("id", reviewId)
      .maybeSingle();

    if (reviewError) {
      throw reviewError;
    }

    if (!review) {
      return {
        success: false,
        message: "L'avis n'a pas été trouvé.",
      };
    }

    // Vérifier si le like existe déjà
    const { data: existingLike, error: existingLikeError } = await db.client
      .from("review_likes")
      .select("review_id, user_id")
      .eq("review_id", reviewId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingLikeError) {
      throw existingLikeError;
    }

    if (existingLike) {
      return {
        success: false,
        message: "Vous avez déjà liké cet avis.",
      };
    }

    // Créer le like
    const { error: likeError } = await db.client
      .from("review_likes")
      .insert([{ review_id: reviewId, user_id: userId }]);

    if (likeError) {
      throw likeError;
    }

    revalidatePath(`/books/${review.book_id}`);
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e pour liker un avis.",
      };
    }
    console.error("[review] likeReview error:", error);
    return {
      success: false,
      message: "Impossible de liker cet avis.",
    };
  }
};

export const unlikeReview = async (reviewId: string): Promise<ActionResult> => {
  try {
    const userId = await requireSession();

    // Vérifier que la review existe
    const { data: review, error: reviewError } = await db.client
      .from("reviews")
      .select("book_id")
      .eq("id", reviewId)
      .maybeSingle();

    if (reviewError) {
      throw reviewError;
    }

    if (!review) {
      return {
        success: false,
        message: "L'avis n'a pas été trouvé.",
      };
    }

    // Vérifier si le like existe
    const { data: existingLike, error: existingLikeError } = await db.client
      .from("review_likes")
      .select("review_id, user_id")
      .eq("review_id", reviewId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingLikeError) {
      throw existingLikeError;
    }

    if (!existingLike) {
      return {
        success: false,
        message: "Vous n'avez pas liké cet avis.",
      };
    }

    // Supprimer le like
    const { error: deleteError } = await db.client
      .from("review_likes")
      .delete()
      .eq("review_id", reviewId)
      .eq("user_id", userId);

    if (deleteError) {
      throw deleteError;
    }

    revalidatePath(`/books/${review.book_id}`);
    return { success: true };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e.",
      };
    }
    console.error("[review] unlikeReview error:", error);
    return {
      success: false,
      message: "Impossible de retirer le like.",
    };
  }
};

export const getReviewLikes = async (reviewId: string) => {
  try {
    const { data: likesRows, error: likesError } = await db.client
      .from("review_likes")
      .select(
        `
        user_id,
        users:user_id (
          id,
          display_name,
          avatar_url
        )
      `,
      )
      .eq("review_id", reviewId)
      .order("created_at", { ascending: false });

    if (likesError) {
      throw likesError;
    }

    return {
      success: true,
      likes:
        (likesRows ?? [])
          .map((row) =>
            db.toCamel<{
              users?: { id: string; displayName: string; avatarUrl: string | null };
            }>(row),
          )
          .filter((r) => r.users)
          .map((r) => ({
            id: r.users!.id,
            displayName: r.users!.displayName,
            avatarUrl: r.users!.avatarUrl,
          })),
      count: (likesRows ?? []).length,
    };
  } catch (error) {
    console.error("[review] getReviewLikes error:", error);
    return {
      success: false,
      message: "Impossible de récupérer les likes.",
    };
  }
};

export const getUserLikeStatus = async (reviewId: string) => {
  try {
    const userId = await requireSession();

    const { data: like, error: likeError } = await db.client
      .from("review_likes")
      .select("review_id")
      .eq("review_id", reviewId)
      .eq("user_id", userId)
      .maybeSingle();

    if (likeError) {
      throw likeError;
    }

    return {
      success: true,
      hasLiked: !!like,
    };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: true,
        hasLiked: false,
      };
    }
    console.error("[review] getUserLikeStatus error:", error);
    return {
      success: false,
      message: "Impossible de récupérer le statut.",
    };
  }
};

