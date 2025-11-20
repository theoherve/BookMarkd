import db from "@/lib/supabase/db";

const GOOGLE_BOOKS_QUOTA_LIMIT = 950; // Limite de sécurité

/**
 * Vérifie le quota utilisé aujourd'hui pour Google Books
 * @returns Le nombre de requêtes utilisées aujourd'hui
 */
export const checkGoogleBooksQuota = async (): Promise<number> => {
  try {
    const today = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD

    const { data, error } = await db.client
      .from("google_books_quota")
      .select("request_count")
      .eq("date", today)
      .maybeSingle();

    if (error) {
      console.error("[google-books-quota] check error:", error);
      // En cas d'erreur, retourner 0 pour permettre les requêtes
      // (sécurité : mieux vaut permettre que bloquer si la table n'existe pas)
      return 0;
    }

    return data?.request_count || 0;
  } catch (error) {
    console.error("[google-books-quota] check error:", error);
    return 0;
  }
};

/**
 * Vérifie si Google Books peut être utilisé (quota non atteint)
 * @returns true si le quota n'est pas atteint, false sinon
 */
export const canUseGoogleBooks = async (): Promise<boolean> => {
  try {
    const currentCount = await checkGoogleBooksQuota();
    return currentCount < GOOGLE_BOOKS_QUOTA_LIMIT;
  } catch (error) {
    console.error("[google-books-quota] canUseGoogleBooks error:", error);
    // En cas d'erreur, permettre l'utilisation
    return true;
  }
};

/**
 * Incrémente le compteur de requêtes pour aujourd'hui
 * @returns true si le quota n'est pas dépassé, false sinon
 */
export const incrementGoogleBooksQuota = async (): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD

    // Vérifier d'abord le quota actuel
    const currentCount = await checkGoogleBooksQuota();

    if (currentCount >= GOOGLE_BOOKS_QUOTA_LIMIT) {
      console.warn(
        `[google-books-quota] Quota limit reached: ${currentCount}/${GOOGLE_BOOKS_QUOTA_LIMIT}`
      );
      return false;
    }

    // Upsert: incrémenter si existe, créer si n'existe pas
    // On utilise une requête SELECT puis UPDATE/INSERT pour gérer l'incrémentation
    const { data: existing } = await db.client
      .from("google_books_quota")
      .select("request_count")
      .eq("date", today)
      .maybeSingle();

    if (existing) {
      // Update existant
      const { error } = await db.client
        .from("google_books_quota")
        .update({ request_count: currentCount + 1 })
        .eq("date", today);

      if (error) {
        console.error("[google-books-quota] increment error:", error);
        return true; // Permettre quand même la requête en cas d'erreur
      }
    } else {
      // Insert nouveau
      const { error } = await db.client
        .from("google_books_quota")
        .insert({
          date: today,
          request_count: 1,
        });

      if (error) {
        console.error("[google-books-quota] increment error:", error);
        return true; // Permettre quand même la requête en cas d'erreur
      }
    }

    return true;
  } catch (error) {
    console.error("[google-books-quota] increment error:", error);
    // En cas d'erreur, on permet quand même la requête
    return true;
  }
};

/**
 * Réinitialise le quota (utile pour les tests ou la maintenance)
 */
export const resetGoogleBooksQuota = async (date?: string): Promise<void> => {
  try {
    const targetDate = date || new Date().toISOString().split("T")[0];

    const { error } = await db.client
      .from("google_books_quota")
      .delete()
      .eq("date", targetDate);

    if (error) {
      console.error("[google-books-quota] reset error:", error);
      throw error;
    }
  } catch (error) {
    console.error("[google-books-quota] reset error:", error);
    throw error;
  }
};

export { GOOGLE_BOOKS_QUOTA_LIMIT };

