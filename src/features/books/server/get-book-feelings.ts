import db from "@/lib/supabase/db";

export type FeelingKeyword = {
  id: string;
  label: string;
  slug: string;
  source: "admin" | "user";
};

export type BookFeeling = {
  id: string;
  keyword: FeelingKeyword;
  userId: string;
  userDisplayName: string;
  visibility: "public" | "friends" | "private";
  createdAt: string;
};

/**
 * Récupère tous les mots-clés disponibles (admin + user) triés par usage global
 */
export const getAllFeelingKeywords = async (): Promise<FeelingKeyword[]> => {
  try {
    // Récupérer tous les mots-clés
    const { data: keywordsData, error: keywordsError } = await db.client
      .from("feeling_keywords")
      .select("id, label, slug, source");

    if (keywordsError) {
      throw keywordsError;
    }

    if (!keywordsData || keywordsData.length === 0) {
      return [];
    }

    // Récupérer les compteurs d'utilisation par keyword_id
    const keywordIds = keywordsData.map((k) => k.id as string);
    
    const { data: usageData, error: usageError } = await db.client
      .from("user_book_feelings")
      .select("keyword_id")
      .in("keyword_id", keywordIds);

    if (usageError) {
      throw usageError;
    }

    // Calculer le nombre d'utilisations pour chaque mot-clé
    const usageCounts = new Map<string, number>();
    (usageData ?? []).forEach((row) => {
      const keywordId = row.keyword_id as string;
      usageCounts.set(keywordId, (usageCounts.get(keywordId) ?? 0) + 1);
    });

    // Combiner les données et trier
    const keywordsWithUsage = (keywordsData ?? []).map((k) => ({
      id: k.id as string,
      label: k.label as string,
      slug: k.slug as string,
      source: (k.source as "admin" | "user") ?? "user",
      usageCount: usageCounts.get(k.id as string) ?? 0,
    }));

    // Trier par usage décroissant, puis alphabétiquement si égal
    keywordsWithUsage.sort((a, b) => {
      if (b.usageCount !== a.usageCount) {
        return b.usageCount - a.usageCount;
      }
      return a.label.localeCompare(b.label);
    });

    // Retourner sans le usageCount (pas nécessaire dans le type)
    return keywordsWithUsage.map(({ usageCount, ...keyword }) => keyword);
  } catch (error) {
    console.error("[books] getAllFeelingKeywords error:", error);
    return [];
  }
};

/**
 * Récupère les feelings d'un livre avec filtrage selon la visibilité
 */
export const getBookFeelings = async (
  bookId: string,
  viewerId?: string | null,
  viewerFollowingIds?: Set<string>,
): Promise<BookFeeling[]> => {
  try {
    const { data, error } = await db.client
      .from("user_book_feelings")
      .select(
        `
        id,
        user_id,
        visibility,
        created_at,
        feeling_keywords:keyword_id (
          id,
          label,
          slug,
          source
        ),
        user:user_id (
          id,
          display_name
        )
      `,
      )
      .eq("book_id", bookId);

    if (error) {
      throw error;
    }

    const feelings: BookFeeling[] = [];

    for (const row of data ?? []) {
      const userId = row.user_id as string;
      const visibility = row.visibility as "public" | "friends" | "private";

      // Filtrer selon la visibilité (même logique que reviews)
      if (visibility === "public") {
        // Toujours visible
      } else if (visibility === "friends") {
        // Visible seulement si viewer suit l'utilisateur ou si c'est le viewer lui-même
        if (!viewerId || (viewerId !== userId && !viewerFollowingIds?.has(userId))) {
          continue;
        }
      } else if (visibility === "private") {
        // Visible seulement si c'est le viewer lui-même
        if (viewerId !== userId) {
          continue;
        }
      }

      // Normaliser le keyword
      const keywordRaw = Array.isArray(row.feeling_keywords)
        ? row.feeling_keywords[0]
        : row.feeling_keywords;
      if (!keywordRaw) continue;

      // Normaliser l'utilisateur
      const userRaw = Array.isArray(row.user) ? row.user[0] : row.user;
      if (!userRaw) continue;

      feelings.push({
        id: row.id as string,
        keyword: {
          id: keywordRaw.id as string,
          label: keywordRaw.label as string,
          slug: keywordRaw.slug as string,
          source: (keywordRaw.source as "admin" | "user") ?? "user",
        },
        userId,
        userDisplayName: (userRaw.display_name as string) ?? "Utilisateur·rice",
        visibility,
        createdAt: row.created_at as string,
      });
    }

    return feelings;
  } catch (error) {
    console.error("[books] getBookFeelings error:", error);
    return [];
  }
};

/**
 * Récupère les feelings sélectionnés par le viewer pour un livre
 */
export const getViewerFeelings = async (
  bookId: string,
  viewerId: string,
): Promise<{ keywordIds: string[]; visibility: "public" | "friends" | "private" }> => {
  try {
    const { data, error } = await db.client
      .from("user_book_feelings")
      .select("keyword_id, visibility")
      .eq("user_id", viewerId)
      .eq("book_id", bookId)
      .limit(1);

    if (error) {
      throw error;
    }

    const keywordIds = (data ?? []).map((row) => row.keyword_id as string);
    // Récupérer la visibilité du premier feeling (tous ont la même visibilité)
    const visibility = (data?.[0]?.visibility as "public" | "friends" | "private") ?? "public";

    return { keywordIds, visibility };
  } catch (error) {
    console.error("[books] getViewerFeelings error:", error);
    return { keywordIds: [], visibility: "public" };
  }
};

