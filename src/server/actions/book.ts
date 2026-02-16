'use server';

import { revalidatePath } from "next/cache";

import { getCurrentSession } from "@/lib/auth/session";
import db from "@/lib/supabase/db";
import { uploadCover } from "@/lib/storage/storage";
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
    
    // Récupérer l'enregistrement existant pour vérifier le statut précédent
    const { data: existing, error: existingError } = await db.client
      .from("user_books")
      .select("status")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    const previousStatus = existing?.status as "to_read" | "reading" | "finished" | undefined;
    
    // Lorsqu'on note un livre, il passe automatiquement en "terminé"
    const newStatus = "finished";

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
      const bookTitle = (book as { title: string }).title;
      
      // Créer une activité de notation
      void createActivity(userId, "rating", {
        book_id: bookId,
        book_title: bookTitle,
        rating,
      });
      
      // Si le statut a changé vers "finished", créer aussi une activité de changement de statut
      if (previousStatus && previousStatus !== "finished") {
        void createActivity(userId, "status_change", {
          book_id: bookId,
          book_title: bookTitle,
          status_note: "a terminé",
        });
      }
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
    const coverFile = formData.get("coverFile") as File | null;
    const coverUrlFromInput = formData.get("coverUrl")?.toString().trim() || null;
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

    // Priorité : fichier uploadé > URL
    const hasCoverFile = coverFile && coverFile.size > 0;
    const allowedCoverTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (hasCoverFile) {
      if (!allowedCoverTypes.includes(coverFile.type)) {
        return {
          success: false,
          message: "Format de fichier non supporté. Utilisez JPEG, PNG ou WebP.",
        };
      }
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (coverFile.size > maxSize) {
        return {
          success: false,
          message: "Le fichier est trop volumineux. Taille maximale : 5Mo.",
        };
      }
    }

    const initialCoverUrl = hasCoverFile ? null : coverUrlFromInput;

    const { data: inserted, error: insertBookError } = await db.client
      .from("books")
      .insert([
        {
          title,
          author,
          cover_url: initialCoverUrl,
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

    const bookId = inserted.id as string;

    // Si un fichier a été uploadé, l'enregistrer dans le storage
    if (hasCoverFile && coverFile) {
      const extension = coverFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const validExtensions = ["jpg", "jpeg", "png", "webp"];
      const finalExtension = validExtensions.includes(extension) ? extension : "jpg";

      const uploadResult = await uploadCover(bookId, coverFile, finalExtension);

      if (uploadResult) {
        await db.client
          .from("books")
          .update({ cover_url: uploadResult.publicUrl })
          .eq("id", bookId);
      }
    }

    revalidatePath("/search");
    revalidatePath(`/books/${bookId}`);

    return { success: true, bookId };
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

// ============================================================================
// Feeling Keywords Actions
// ============================================================================

type FeelingKeyword = {
  id: string;
  label: string;
  slug: string;
  source: "admin" | "user";
};

type UpsertBookFeelingsResult =
  | { success: true; keywords: FeelingKeyword[] }
  | { success: false; message: string };

const generateSlug = (label: string): string => {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[^a-z0-9]+/g, "-") // Remplace les caractères non alphanumériques par des tirets
    .replace(/^-+|-+$/g, ""); // Supprime les tirets en début et fin
};

export const createFeelingKeyword = async (
  label: string,
): Promise<{ success: true; keyword: FeelingKeyword } | { success: false; message: string }> => {
  try {
    const userId = await requireSession();

    if (!label || !label.trim()) {
      return {
        success: false,
        message: "Le mot-clé ne peut pas être vide.",
      };
    }

    const trimmedLabel = label.trim();
    const slug = generateSlug(trimmedLabel);

    // Vérifier si le slug existe déjà
    const { data: existing, error: checkError } = await db.client
      .from("feeling_keywords")
      .select("id, label, slug, source")
      .eq("slug", slug)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    // Si existe déjà, retourner l'existant
    if (existing) {
      return {
        success: true,
        keyword: {
          id: existing.id as string,
          label: existing.label as string,
          slug: existing.slug as string,
          source: (existing.source as "admin" | "user") ?? "user",
        },
      };
    }

    // Créer le nouveau mot-clé
    const { data: inserted, error: insertError } = await db.client
      .from("feeling_keywords")
      .insert([
        {
          label: trimmedLabel,
          slug,
          source: "user",
          created_by: userId,
        },
      ])
      .select("id, label, slug, source")
      .single();

    if (insertError) {
      throw insertError;
    }

    return {
      success: true,
      keyword: {
        id: inserted.id as string,
        label: inserted.label as string,
        slug: inserted.slug as string,
        source: (inserted.source as "admin" | "user") ?? "user",
      },
    };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e pour créer un mot-clé.",
      };
    }
    console.error("[book] createFeelingKeyword error:", error);
    return {
      success: false,
      message: "Impossible de créer ce mot-clé.",
    };
  }
};

export const upsertBookFeelings = async (
  bookId: string,
  keywordIds: string[],
  visibility: "public" | "friends" | "private",
): Promise<UpsertBookFeelingsResult> => {
  try {
    const userId = await requireSession();

    if (!Array.isArray(keywordIds)) {
      return {
        success: false,
        message: "Les mots-clés doivent être un tableau.",
      };
    }

    // Récupérer les feelings existants de l'utilisateur pour ce livre
    const { data: existingFeelings, error: existingError } = await db.client
      .from("user_book_feelings")
      .select("keyword_id")
      .eq("user_id", userId)
      .eq("book_id", bookId);

    if (existingError) {
      throw existingError;
    }

    const existingKeywordIds = new Set(
      (existingFeelings ?? []).map((f) => f.keyword_id as string),
    );

    // Identifier les mots-clés à supprimer (présents dans existing mais pas dans keywordIds)
    const toDelete = Array.from(existingKeywordIds).filter(
      (id) => !keywordIds.includes(id),
    );

    // Identifier les mots-clés à ajouter (présents dans keywordIds mais pas dans existing)
    const toAdd = keywordIds.filter((id) => !existingKeywordIds.has(id));

    // Supprimer les feelings qui ne sont plus sélectionnés
    if (toDelete.length > 0) {
      const { error: deleteError } = await db.client
        .from("user_book_feelings")
        .delete()
        .eq("user_id", userId)
        .eq("book_id", bookId)
        .in("keyword_id", toDelete);

      if (deleteError) {
        throw deleteError;
      }
    }

    // Ajouter les nouveaux feelings
    if (toAdd.length > 0) {
      const feelingsToInsert = toAdd.map((keywordId) => ({
        user_id: userId,
        book_id: bookId,
        keyword_id: keywordId,
        visibility,
      }));

      const { error: insertError } = await db.client
        .from("user_book_feelings")
        .insert(feelingsToInsert);

      if (insertError) {
        throw insertError;
      }
    }

    // Mettre à jour la visibilité des feelings existants qui restent
    if (keywordIds.length > 0) {
      const { error: updateError } = await db.client
        .from("user_book_feelings")
        .update({ visibility })
        .eq("user_id", userId)
        .eq("book_id", bookId)
        .in("keyword_id", keywordIds);

      if (updateError) {
        throw updateError;
      }
    }

    // Récupérer les mots-clés finaux pour retour
    const { data: finalFeelings, error: finalError } = await db.client
      .from("user_book_feelings")
      .select(
        `
        keyword_id,
        feeling_keywords:keyword_id (
          id,
          label,
          slug,
          source
        )
      `,
      )
      .eq("user_id", userId)
      .eq("book_id", bookId);

    if (finalError) {
      throw finalError;
    }

    const keywords: FeelingKeyword[] = (finalFeelings ?? [])
      .map((f) => {
        const keyword = Array.isArray(f.feeling_keywords)
          ? f.feeling_keywords[0]
          : f.feeling_keywords;
        if (!keyword) return null;
        return {
          id: keyword.id as string,
          label: keyword.label as string,
          slug: keyword.slug as string,
          source: (keyword.source as "admin" | "user") ?? "user",
        };
      })
      .filter((k): k is FeelingKeyword => k !== null);

    revalidateBook(bookId);
    return { success: true, keywords };
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return {
        success: false,
        message: "Vous devez être connecté·e pour modifier vos mots-clés.",
      };
    }
    console.error("[book] upsertBookFeelings error:", error);
    return {
      success: false,
      message: "Impossible de sauvegarder vos mots-clés.",
    };
  }
};
