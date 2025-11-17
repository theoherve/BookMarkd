'use server';

import { revalidatePath } from "next/cache";

import { getCurrentSession } from "@/lib/auth/session";
import db from "@/lib/supabase/db";
import { createNotification } from "@/server/actions/notifications";
import { createActivity } from "@/lib/activities/create-activity";

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
    const { data: existing, error: existingError } = await db.client
      .from("user_books")
      .select("rating")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    // Upsert via contrainte unique (user_id, book_id)
    const { error: upsertError } = await db.client
      .from("user_books")
      .upsert(
        [
          {
            user_id: userId,
            book_id: bookId,
            status,
            // Préserver le rating s'il existe
            rating: existing?.rating ?? null,
          },
        ],
        {
          onConflict: "user_id,book_id",
        },
      );

    if (upsertError) {
      throw upsertError;
    }

    // Récupérer le titre du livre pour l'activité
    const { data: book, error: bookError } = await db.client
      .from("books")
      .select("title")
      .eq("id", bookId)
      .maybeSingle();

    if (!bookError && book) {
      // Créer une activité de changement de statut
      const statusLabels: Record<string, string> = {
        to_read: "a ajouté à sa liste de lecture",
        reading: "a commencé à lire",
        finished: "a terminé",
      };
      const statusNote = statusLabels[status] || "a mis à jour son statut";
      
      void createActivity(userId, "status_change", {
        book_id: bookId,
        book_title: (book as { title: string }).title,
        status_note: statusNote,
      });
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
    
    // Récupérer l'enregistrement existant pour préserver le status s'il existe
    const { data: existing, error: existingError } = await db.client
      .from("user_books")
      .select("status")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    // Upsert: met à jour le rating et rated_at, préserve ou fixe le status
    const newStatus =
      (existing?.status as "to_read" | "reading" | "finished" | undefined) ??
      "finished";

    const { error: upsertError } = await db.client
      .from("user_books")
      .upsert(
        [
          {
            user_id: userId,
            book_id: bookId,
            status: newStatus,
            rating,
            rated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "user_id,book_id" },
      );

    if (upsertError) {
      throw upsertError;
    }

    // Mettre à jour les statistiques du livre (ratings_count et average_rating)
    const { data: allRatings, error: ratingsError } = await db.client
      .from("user_books")
      .select("rating")
      .eq("book_id", bookId)
      .not("rating", "is", null);

    if (ratingsError) {
      throw ratingsError;
    }

    const ratings = (allRatings ?? [])
      .map((r: { rating: number | null }) => r.rating)
      .filter((v): v is number => typeof v === "number");

    const ratingsCount = ratings.length;
    let averageRating: number | null = null;

    if (ratingsCount > 0) {
      const sum = ratings.reduce((acc, val) => acc + val, 0);
      averageRating = parseFloat((sum / ratingsCount).toFixed(2));
    }

    // Mettre à jour le livre avec les nouvelles statistiques
    const { error: updateBookError } = await db.client
      .from("books")
      .update({
        ratings_count: ratingsCount,
        average_rating: averageRating ?? 0,
      })
      .eq("id", bookId);

    if (updateBookError) {
      throw updateBookError;
    }

    // Récupérer le titre du livre pour l'activité
    const { data: book, error: bookError } = await db.client
      .from("books")
      .select("title")
      .eq("id", bookId)
      .maybeSingle();

    if (!bookError && book) {
      // Créer une activité de notation
      void createActivity(userId, "rating", {
        book_id: bookId,
        book_title: (book as { title: string }).title,
        rating,
      });
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
    
    const { error: insertError } = await db.client.from("reviews").insert([
      {
        user_id: userId,
        book_id: bookId,
        visibility,
        title: title || null,
        content,
        spoiler: Boolean(spoiler),
      },
    ]);

    if (insertError) {
      throw insertError;
    }

    // Récupérer le titre du livre pour l'activité
    // Ne créer une activité que si la visibilité est "public" ou "friends"
    if (visibility === "public" || visibility === "friends") {
      const { data: book, error: bookError } = await db.client
        .from("books")
        .select("title")
        .eq("id", bookId)
        .maybeSingle();

      if (!bookError && book) {
        // Créer une activité de commentaire/critique
        // Extraire un extrait du commentaire (premiers 150 caractères)
        const reviewSnippet = content.length > 150 
          ? `${content.substring(0, 150)}...` 
          : content;
        
        await createActivity(userId, "review", {
          book_id: bookId,
          book_title: (book as { title: string }).title,
          review_snippet: reviewSnippet,
          note: reviewSnippet,
          visibility, // Inclure la visibilité dans le payload pour filtrage ultérieur
        });
      }
    }

    // Notifier les followers (optionnel: ici on ne notifie que l'auteur·e lui/elle-même pour simplifier)
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

    const { error: commentError } = await db.client
      .from("review_comments")
      .insert([
        {
          review_id: reviewId,
          user_id: userId,
          content,
        },
      ]);

    if (commentError) {
      throw commentError;
    }

    // Notifier l'auteur de l'avis si différent
    const { data: reviewOwnerRow } = await db.client
      .from("reviews")
      .select("user_id, book_id")
      .eq("id", reviewId)
      .maybeSingle();
    const reviewOwnerId = (reviewOwnerRow as { user_id?: string; book_id?: string } | null)?.user_id ?? null;
    if (reviewOwnerId && reviewOwnerId !== (userId as string)) {
      void createNotification(reviewOwnerId, "review_comment", {});
    }

    revalidateBook(review.book_id as string);
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
    const { data: userExists, error: userError } = await db.client
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

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

    const { data: inserted, error: insertBookError } = await db.client
      .from("books")
      .insert([
        {
          title,
          author,
          cover_url: coverUrl,
          publication_year: publicationYear,
          summary,
          created_by: userId,
          ratings_count: 0,
          average_rating: 0,
        },
      ])
      .select("id")
      .single();

    if (insertBookError) {
      throw insertBookError;
    }

    revalidatePath("/search");
    revalidatePath(`/books/${inserted.id}`);

    return { success: true, bookId: inserted.id as string };
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
