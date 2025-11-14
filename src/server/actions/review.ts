"use server";

import { revalidatePath } from "next/cache";

import { getCurrentSession } from "@/lib/auth/session";
import { resolveSessionUserId } from "@/lib/auth/user";
import { prisma } from "@/lib/prisma/client";

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
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { bookId: true },
    });

    if (!review) {
      return {
        success: false,
        message: "L'avis n'a pas été trouvé.",
      };
    }

    // Vérifier si le like existe déjà
    const existingLike = await prisma.reviewLike.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    if (existingLike) {
      return {
        success: false,
        message: "Vous avez déjà liké cet avis.",
      };
    }

    // Créer le like
    await prisma.reviewLike.create({
      data: {
        reviewId,
        userId,
      },
    });

    revalidatePath(`/books/${review.bookId}`);
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
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { bookId: true },
    });

    if (!review) {
      return {
        success: false,
        message: "L'avis n'a pas été trouvé.",
      };
    }

    // Vérifier si le like existe
    const existingLike = await prisma.reviewLike.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    if (!existingLike) {
      return {
        success: false,
        message: "Vous n'avez pas liké cet avis.",
      };
    }

    // Supprimer le like
    await prisma.reviewLike.delete({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    revalidatePath(`/books/${review.bookId}`);
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
    const likes = await prisma.reviewLike.findMany({
      where: { reviewId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      likes: likes.map((like) => ({
        id: like.user.id,
        displayName: like.user.displayName,
        avatarUrl: like.user.avatarUrl,
      })),
      count: likes.length,
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

    const like = await prisma.reviewLike.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

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

