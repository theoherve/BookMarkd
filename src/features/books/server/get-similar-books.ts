import db from "@/lib/supabase/db";
import { getBookCoverUrl } from "@/lib/storage/covers";

export type SimilarBook = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  matchingTags: string[];
};

const DEFAULT_LIMIT = 6;

/**
 * Récupère les livres similaires au livre donné, présents dans la bibliothèque Bookmarkd.
 * Critères : tags en commun (prioritaire), puis même auteur pour compléter.
 */
export const getSimilarBooks = async (
  bookId: string,
  limit: number = DEFAULT_LIMIT,
): Promise<SimilarBook[]> => {
  try {
    // 1. Infos du livre courant (auteur) et ses tags
    const { data: bookRow, error: bookErr } = await db.client
      .from("books")
      .select("id, author")
      .eq("id", bookId)
      .maybeSingle();

    if (bookErr || !bookRow) {
      return [];
    }

    const { data: tagRelations, error: tagsErr } = await db.client
      .from("book_tags")
      .select("tag:tag_id ( id, name )")
      .eq("book_id", bookId);

    if (tagsErr) {
      return [];
    }

    const getTagName = (tag: unknown): string | null => {
      if (!tag || typeof tag !== "object") return null;
      const t = Array.isArray(tag) ? tag[0] : (tag as { name?: string | null });
      return (t as { name?: string | null })?.name ?? null;
    };

    const currentTagIds: string[] = [];
    const currentTagNames: string[] = [];
    (tagRelations ?? []).forEach((rel: { tag?: unknown }) => {
      const tag = rel.tag;
      const tagObj = Array.isArray(tag) ? tag?.[0] : tag;
      if (tagObj && typeof tagObj === "object" && "id" in tagObj) {
        currentTagIds.push((tagObj as { id: string }).id);
        const name = getTagName(tag);
        if (name) currentTagNames.push(name);
      }
    });

    const bookScores = new Map<
      string,
      { score: number; matchingTags: string[] }
    >();

    // 2. Livres avec au moins un tag en commun (tous dans la table books = bibliothèque Bookmarkd)
    if (currentTagIds.length > 0) {
      const { data: candidateRelations, error: candidateErr } = await db.client
        .from("book_tags")
        .select("book_id, tag:tag_id ( name )")
        .in("tag_id", currentTagIds);

      if (!candidateErr && candidateRelations) {
        candidateRelations.forEach(
          (rel: { book_id?: string | null; tag?: unknown }) => {
            const otherBookId = rel.book_id;
            if (!otherBookId || otherBookId === bookId) return;

            const tagName = getTagName(rel.tag);
            if (!tagName) return;

            const existing = bookScores.get(otherBookId);
            if (existing) {
              existing.score += 1;
              if (!existing.matchingTags.includes(tagName)) {
                existing.matchingTags.push(tagName);
              }
            } else {
              bookScores.set(otherBookId, {
                score: 1,
                matchingTags: [tagName],
              });
            }
          },
        );
      }
    }

    // 3. Trier par score décroissant et prendre les premiers
    const similarBookIds = Array.from(bookScores.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit)
      .map(([id]) => id);

    const scoreMap = new Map(bookScores);

    // 4. Si pas assez de résultats, compléter avec même auteur (toujours dans books = bibliothèque)
    const author = (bookRow as { author?: string }).author;
    if (similarBookIds.length < limit && author) {
      const { data: sameAuthorRows, error: authorErr } = await db.client
        .from("books")
        .select("id")
        .eq("author", author)
        .neq("id", bookId)
        .limit(limit);

      if (!authorErr && sameAuthorRows) {
        const existingSet = new Set(similarBookIds);
        for (const row of sameAuthorRows as Array<{ id: string }>) {
          if (existingSet.has(row.id)) continue;
          similarBookIds.push(row.id);
          if (!scoreMap.has(row.id)) {
            scoreMap.set(row.id, { score: 0, matchingTags: [] });
          }
          if (similarBookIds.length >= limit) break;
        }
      }
    }

    if (similarBookIds.length === 0) {
      return [];
    }

    // 5. Récupérer les détails des livres (id, title, author, cover_url)
    const { data: booksData, error: booksErr } = await db.client
      .from("books")
      .select("id, title, author, cover_url")
      .in("id", similarBookIds);

    if (booksErr || !booksData || booksData.length === 0) {
      return [];
    }

    // Garder l'ordre de similarBookIds
    const orderIndex = new Map(similarBookIds.map((id, i) => [id, i]));
    const sorted = [...booksData].sort((a, b) => {
      const aIdx = orderIndex.get((a as { id: string }).id) ?? 999;
      const bIdx = orderIndex.get((b as { id: string }).id) ?? 999;
      return aIdx - bIdx;
    });

    // 6. Résoudre les URLs de couverture et formater
    const result: SimilarBook[] = [];
    for (const book of sorted) {
      const id = (book as { id: string }).id;
      const coverUrl = await getBookCoverUrl(
        id,
        (book as { cover_url?: string | null }).cover_url,
      );
      const { matchingTags } = scoreMap.get(id) ?? { matchingTags: [] };
      result.push({
        id,
        title: (book as { title: string }).title,
        author: (book as { author: string }).author,
        coverUrl,
        matchingTags,
      });
    }

    return result;
  } catch {
    return [];
  }
};
