import db from "@/lib/supabase/db";
import { getBookCoverUrl } from "@/lib/storage/covers";

export type UserCompatibility = {
  score: number;
  reason: string;
  sharedTagsCount: number;
  sharedBooksCount: number;
};

export type ProfileSuggestion = {
  id: string;
  bookId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  score: number;
  reason: string;
  matchingTags: string[];
  viewerHasInReadlist: boolean;
};

export type ProfileSuggestionsResult = {
  userCompatibility: UserCompatibility;
  suggestions: ProfileSuggestion[];
};

const STATUS_WEIGHT = {
  finished: 3,
  reading: 2,
  to_read: 1,
} as const;

const BOOK_SUGGESTIONS_LIMIT = 6;
const USER_SCORE_WEIGHT = 0.4;
const BOOK_SCORE_WEIGHT = 0.6;

const getTagName = (tag: unknown): string | null => {
  if (!tag || typeof tag !== "object") return null;
  const t = Array.isArray(tag) ? tag[0] : (tag as { name?: string | null });
  return (t as { name?: string | null })?.name ?? null;
};

/**
 * Calcule les suggestions de livres pour le visiteur basées sur le profil visité.
 * Combine : compatibilité livre (tags en commun avec le visiteur) + compatibilité user (affinité entre les deux utilisateurs).
 * Retourne null si le visiteur n'est pas connecté ou si pas assez de données.
 */
export const getProfileSuggestions = async (
  viewerId: string,
  profileUserId: string,
  profileDisplayName: string,
): Promise<ProfileSuggestionsResult | null> => {
  try {
    // 1. Récupérer les livres et tags du visiteur
    const { data: viewerBooks, error: viewerBooksErr } = await db.client
      .from("user_books")
      .select("book_id, status")
      .eq("user_id", viewerId)
      .in("status", ["finished", "reading", "to_read"]);

    if (viewerBooksErr || !viewerBooks || viewerBooks.length === 0) {
      return null;
    }

    const viewerBookIds = (viewerBooks ?? []).map(
      (ub) => (ub as { book_id: string }).book_id,
    ).filter((id): id is string => Boolean(id));

    const { data: viewerTagRels, error: viewerTagsErr } = await db.client
      .from("book_tags")
      .select("book_id, tag:tag_id ( name )")
      .in("book_id", viewerBookIds);

    if (viewerTagsErr) return null;

    const viewerTagWeights = new Map<string, number>();
    const viewerBookStatusMap = new Map<string, string>();
    (viewerBooks ?? []).forEach((ub) => {
      const bookId = (ub as { book_id: string; status: string }).book_id;
      const status = (ub as { book_id: string; status: string }).status;
      if (bookId) viewerBookStatusMap.set(bookId, status);
    });

    (viewerTagRels ?? []).forEach((rel) => {
      const bookId = (rel as { book_id: string | null }).book_id;
      const tagName = getTagName((rel as { tag: unknown }).tag);
      if (!bookId || !tagName) return;
      const status = viewerBookStatusMap.get(bookId) ?? "to_read";
      const weight = STATUS_WEIGHT[status as keyof typeof STATUS_WEIGHT] ?? 1;
      viewerTagWeights.set(
        tagName,
        (viewerTagWeights.get(tagName) ?? 0) + weight,
      );
    });

    // 2. Récupérer les livres et tags du profil visité
    const { data: profileBooks, error: profileBooksErr } = await db.client
      .from("user_books")
      .select("book_id, status, rating")
      .eq("user_id", profileUserId)
      .in("status", ["finished", "reading", "to_read"]);

    if (profileBooksErr || !profileBooks || profileBooks.length === 0) {
      return null;
    }

    const profileBookIds = (profileBooks ?? []).map(
      (ub) => (ub as { book_id: string }).book_id,
    ).filter((id): id is string => Boolean(id));

    const { data: profileTagRels, error: profileTagsErr } = await db.client
      .from("book_tags")
      .select("book_id, tag:tag_id ( name )")
      .in("book_id", profileBookIds);

    if (profileTagsErr) return null;

    const profileTagWeights = new Map<string, number>();
    const profileBookStatusMap = new Map<string, string>();
    const profileBookRatingMap = new Map<string, number>();
    (profileBooks ?? []).forEach((ub) => {
      const row = ub as { book_id: string; status: string; rating?: number | null };
      if (row.book_id) {
        profileBookStatusMap.set(row.book_id, row.status);
        if (typeof row.rating === "number") {
          profileBookRatingMap.set(row.book_id, row.rating);
        }
      }
    });

    (profileTagRels ?? []).forEach((rel) => {
      const bookId = (rel as { book_id: string | null }).book_id;
      const tagName = getTagName((rel as { tag: unknown }).tag);
      if (!bookId || !tagName) return;
      const status = profileBookStatusMap.get(bookId) ?? "to_read";
      const weight = STATUS_WEIGHT[status as keyof typeof STATUS_WEIGHT] ?? 1;
      profileTagWeights.set(
        tagName,
        (profileTagWeights.get(tagName) ?? 0) + weight,
      );
    });

    // 3. Calcul compatibilité user (tags en commun + livres partagés)
    const sharedTagNames: string[] = [];
    viewerTagWeights.forEach((_viewerW, tagName) => {
      const profileW = profileTagWeights.get(tagName);
      if (profileW) {
        sharedTagNames.push(tagName);
      }
    });

    const viewerBookSet = new Set(viewerBookIds);
    const sharedBooksCount = profileBookIds.filter((id) =>
      viewerBookSet.has(id),
    ).length;

    const viewerTagCount = viewerTagWeights.size;
    const profileTagCount = profileTagWeights.size;
    const maxTags = Math.max(viewerTagCount, profileTagCount, 1);
    const tagOverlapRatio = sharedTagNames.length / maxTags;
    const tagScoreNorm = Math.round(tagOverlapRatio * 80);
    const sharedBooksBonus = Math.min(20, sharedBooksCount * 5);
    const userCompatibilityScore = Math.min(100, tagScoreNorm + sharedBooksBonus);

    const userReasonParts: string[] = [];
    if (sharedTagNames.length > 0) {
      userReasonParts.push(
        `${sharedTagNames.length} tag${sharedTagNames.length > 1 ? "s" : ""} en commun`,
      );
    }
    if (sharedBooksCount > 0) {
      userReasonParts.push(
        `${sharedBooksCount} livre${sharedBooksCount > 1 ? "s" : ""} partagé${sharedBooksCount > 1 ? "s" : ""}`,
      );
    }
    const userReason =
      userReasonParts.length > 0
        ? userReasonParts.join(", ")
        : "Profils à découvrir";

    const userCompatibility: UserCompatibility = {
      score: userCompatibilityScore,
      reason: userReason,
      sharedTagsCount: sharedTagNames.length,
      sharedBooksCount,
    };

    // 4. Livres candidats : ceux du profil que le visiteur n'a pas
    const candidateBookIds = profileBookIds.filter((id) => !viewerBookSet.has(id));

    if (candidateBookIds.length === 0) {
      return { userCompatibility, suggestions: [] };
    }

    // 5. Récupérer les tags des livres candidats
    const { data: candidateTagRels, error: candidateTagsErr } = await db.client
      .from("book_tags")
      .select("book_id, tag:tag_id ( name )")
      .in("book_id", candidateBookIds);

    if (candidateTagsErr) return { userCompatibility, suggestions: [] };

    const bookScores = new Map<
      string,
      { score: number; matchingTags: string[] }
    >();

    (candidateTagRels ?? []).forEach((rel) => {
      const bookId = (rel as { book_id: string | null }).book_id;
      const tagName = getTagName((rel as { tag: unknown }).tag);
      if (!bookId || !tagName) return;

      const tagWeight = viewerTagWeights.get(tagName) ?? 0;
      if (tagWeight === 0) return;

      const existing = bookScores.get(bookId);
      if (existing) {
        existing.score += tagWeight;
        if (!existing.matchingTags.includes(tagName)) {
          existing.matchingTags.push(tagName);
        }
      } else {
        bookScores.set(bookId, { score: tagWeight, matchingTags: [tagName] });
      }
    });

    // 6. Score combiné : pondération livre + user, avec bonus pour rating élevé du profil
    const allBookScores = Array.from(bookScores.values()).map((s) => s.score);
    const maxBookScore = Math.max(...allBookScores, 1);
    const minBookScore = Math.min(...allBookScores, 0);
    const bookScoreRange = maxBookScore - minBookScore || 1;

    const combinedScores = candidateBookIds.map((bookId) => {
      const bookData = bookScores.get(bookId);
      const rawBookScore = bookData?.score ?? 0;
      const bookScoreNorm =
        bookScoreRange > 0
          ? Math.round(((rawBookScore - minBookScore) / bookScoreRange) * 100)
          : 50;

      const rating = profileBookRatingMap.get(bookId);
      const ratingBonus = typeof rating === "number" && rating >= 4 ? 10 : 0;

      const combined =
        bookScoreNorm * BOOK_SCORE_WEIGHT +
        userCompatibilityScore * USER_SCORE_WEIGHT +
        ratingBonus;

      return {
        bookId,
        score: Math.min(100, Math.round(combined)),
        matchingTags: bookData?.matchingTags ?? [],
      };
    });

    const sorted = combinedScores
      .sort((a, b) => b.score - a.score)
      .slice(0, BOOK_SUGGESTIONS_LIMIT);

    const topBookIds = sorted.map((s) => s.bookId);

    const { data: booksData, error: booksErr } = await db.client
      .from("books")
      .select("id, title, author, cover_url")
      .in("id", topBookIds);

    if (booksErr || !booksData || booksData.length === 0) {
      return { userCompatibility, suggestions: [] };
    }

    const orderIndex = new Map(topBookIds.map((id, i) => [id, i]));
    const sortedBooks = [...booksData].sort((a, b) => {
      const aIdx = orderIndex.get((a as { id: string }).id) ?? 999;
      const bIdx = orderIndex.get((b as { id: string }).id) ?? 999;
      return aIdx - bIdx;
    });

    const scoreMap = new Map(sorted.map((s) => [s.bookId, s]));

    const { data: viewerHasBooks } = await db.client
      .from("user_books")
      .select("book_id")
      .eq("user_id", viewerId)
      .in("book_id", topBookIds);
    const viewerHasBookIds = new Set(
      (viewerHasBooks ?? []).map((r) => (r as { book_id: string }).book_id),
    );

    const suggestions: ProfileSuggestion[] = [];
    for (const book of sortedBooks) {
      const id = (book as { id: string }).id;
      const coverUrl = await getBookCoverUrl(
        id,
        (book as { cover_url?: string | null }).cover_url,
      );
      const scoreData = scoreMap.get(id);
      const matchingTags = scoreData?.matchingTags ?? [];
      const score = scoreData?.score ?? 50;

      const reasonParts: string[] = [];
      if (matchingTags.length > 0) {
        reasonParts.push(
          `Tags : ${matchingTags.slice(0, 3).join(", ")}`,
        );
      }
      reasonParts.push(`Affinité avec ${profileDisplayName} : ${userCompatibilityScore}%`);
      const reason = reasonParts.join(" • ");

      suggestions.push({
        id: `profile-suggestion-${id}`,
        bookId: id,
        title: (book as { title: string }).title,
        author: (book as { author: string }).author,
        coverUrl,
        score,
        reason,
        matchingTags,
        viewerHasInReadlist: viewerHasBookIds.has(id),
      });
    }

    return { userCompatibility, suggestions };
  } catch (error) {
    console.error("[profile] getProfileSuggestions error:", error);
    return null;
  }
};
