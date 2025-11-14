'use server';

import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

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
    
    // Récupérer l'enregistrement existant pour préserver le rating s'il existe
    const existing = await prisma.userBook.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
    });

    await prisma.userBook.upsert({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
      update: {
        status,
        // Préserver le rating s'il existe
        rating: existing?.rating ?? null,
      },
      create: {
        userId,
        bookId,
        status,
      },
    });

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
    
    // Récupérer l'enregistrement existant pour préserver le status s'il existe
    const existing = await prisma.userBook.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
    });

    // Convertir le rating en Decimal pour Prisma
    const ratingDecimal = new Decimal(rating);

    // Upsert avec Prisma : met à jour le rating et rated_at, préserve le status s'il existe
    // Si le livre n'a pas encore de statut, mettre "finished" automatiquement
    await prisma.userBook.upsert({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
      update: {
        rating: ratingDecimal,
        ratedAt: new Date(),
        // Préserver le status s'il existe, sinon utiliser 'finished' par défaut
        status: (existing?.status as "to_read" | "reading" | "finished") ?? "finished",
      },
      create: {
        userId,
        bookId,
        status: "finished", // Status par défaut si création (noter un livre = l'avoir terminé)
        rating: ratingDecimal,
        ratedAt: new Date(),
      },
    });

    // Mettre à jour les statistiques du livre (ratings_count et average_rating)
    const allRatings = await prisma.userBook.findMany({
      where: {
        bookId,
        rating: { not: null },
      },
      select: {
        rating: true,
      },
    });

    const ratingsCount = allRatings.length;
    let averageRating: Decimal | null = null;

    if (ratingsCount > 0) {
      const sum = allRatings.reduce((acc, ub) => {
        if (ub.rating) {
          return acc.plus(ub.rating);
        }
        return acc;
      }, new Decimal(0));
      averageRating = sum.dividedBy(ratingsCount);
    }

    // Mettre à jour le livre avec les nouvelles statistiques
    await prisma.book.update({
      where: { id: bookId },
      data: {
        ratingsCount,
        averageRating: averageRating ?? new Decimal(0),
      },
    });

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
      message: "Impossible d'enregistrer votre note.",
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
    
    await prisma.review.create({
      data: {
        userId,
        bookId,
        visibility,
        title: title || null,
        content,
        spoiler: Boolean(spoiler),
      },
    });

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
    
    // Vérifier que la review existe et récupérer le bookId
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

    await prisma.reviewComment.create({
      data: {
        reviewId,
        userId,
        content,
      },
    });

    revalidateBook(review.bookId);
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
      message: "Impossible d'ajouter ce commentaire.",
    };
  }
};

type CreateBookResult =
  | { success: true; bookId: string }
  | { success: false; message: string };

export const createBook = async (
  formData: FormData,
): Promise<CreateBookResult> => {
  try {
    const userId = await requireSession();

    // Vérifier que l'utilisateur existe dans la base de données
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      return {
        success: false,
        message: "Utilisateur non trouvé dans la base de données.",
      };
    }

    const title = formData.get("title")?.toString().trim();
    const author = formData.get("author")?.toString().trim();
    const coverUrl = formData.get("coverUrl")?.toString().trim() || null;
    const publicationYearStr = formData.get("publicationYear")?.toString().trim();
    const publicationYear = publicationYearStr
      ? parseInt(publicationYearStr, 10)
      : null;
    const summary = formData.get("summary")?.toString().trim() || null;

    if (!title || !author) {
      return {
        success: false,
        message: "Le titre et l'auteur sont requis.",
      };
    }

    if (publicationYear && (isNaN(publicationYear) || publicationYear < 0 || publicationYear > new Date().getFullYear() + 10)) {
      return {
        success: false,
        message: "L'année de publication doit être valide.",
      };
    }

    const newBook = await prisma.book.create({
      data: {
        title,
        author,
        coverUrl,
        publicationYear,
        summary,
        createdBy: userId,
        ratingsCount: 0,
        averageRating: new Decimal(0),
      },
    });

    revalidatePath("/search");
    revalidatePath(`/books/${newBook.id}`);

    return { success: true, bookId: newBook.id };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e pour ajouter un livre.",
      };
    }
    
    console.error("[book] createBook error:", error);
    return {
      success: false,
      message: "Impossible de créer ce livre. Veuillez réessayer.",
    };
  }
};
