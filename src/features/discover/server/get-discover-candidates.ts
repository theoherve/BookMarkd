import db from "@/lib/supabase/db";
import { getBookCoverUrl } from "@/lib/storage/covers";
import { computeCompatibilityScore } from "@/features/recommendations/compatibility-score";
import { getFriendsRatingScore } from "@/features/recommendations/server/get-friends-rating-score";
import type { DiscoverCandidate, DiscoverMatchReason } from "../types";

const DEFAULT_LIMIT = 20;
const CANDIDATE_POOL_SIZE = 120;
const TOP_PROFILE_AUTHORS = 5;
const TOP_PROFILE_TAGS = 10;
const POSITIVE_STATUS = ["reading", "finished"] as const;

type BookRow = {
  id: string;
  slug: string | null;
  title: string;
  author: string;
  cover_url: string | null;
  summary: string | null;
  publication_year: number | null;
  average_rating: number | null;
  ratings_count: number | null;
};

const getExcludedBookIds = async (userId: string): Promise<Set<string>> => {
  const excluded = new Set<string>();

  const [userBooks, reviews, wishlist, recommendations] = await Promise.all([
    db.client.from("user_books").select("book_id").eq("user_id", userId),
    db.client.from("reviews").select("book_id").eq("user_id", userId),
    db.client.from("discover_wishlist").select("book_id").eq("user_id", userId),
    db.client.from("recommendations").select("book_id").eq("user_id", userId),
  ]);

  for (const source of [userBooks.data, reviews.data, wishlist.data, recommendations.data]) {
    for (const row of source ?? []) {
      const bookId = (row as { book_id: string | null }).book_id;
      if (bookId) excluded.add(bookId);
    }
  }

  return excluded;
};

type UserProfile = {
  topTagIds: string[];
  tagWeight: Map<string, number>;
  topAuthors: string[];
  authorWeight: Map<string, number>;
  totalSignals: number;
};

const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const { data: userBooks } = await db.client
    .from("user_books")
    .select("book_id, status, rating")
    .eq("user_id", userId)
    .in("status", POSITIVE_STATUS as unknown as string[]);

  const bookIds: string[] = [];
  const bookWeight = new Map<string, number>();
  for (const row of (userBooks ?? []) as Array<{
    book_id: string | null;
    status: string | null;
    rating: number | null;
  }>) {
    if (!row.book_id) continue;
    const rating = typeof row.rating === "number" ? row.rating : null;
    let weight = row.status === "finished" ? 1.5 : 1;
    if (rating !== null) weight += Math.max(0, (rating - 3) / 2);
    bookIds.push(row.book_id);
    bookWeight.set(row.book_id, weight);
  }

  if (bookIds.length === 0) {
    return {
      topTagIds: [],
      tagWeight: new Map(),
      topAuthors: [],
      authorWeight: new Map(),
      totalSignals: 0,
    };
  }

  const [authorsRes, tagsRes] = await Promise.all([
    db.client.from("books").select("id, author").in("id", bookIds),
    db.client.from("book_tags").select("book_id, tag_id").in("book_id", bookIds),
  ]);

  const authorWeight = new Map<string, number>();
  for (const row of (authorsRes.data ?? []) as Array<{ id: string; author: string | null }>) {
    if (!row.author) continue;
    const w = bookWeight.get(row.id) ?? 1;
    authorWeight.set(row.author, (authorWeight.get(row.author) ?? 0) + w);
  }

  const tagWeight = new Map<string, number>();
  for (const row of (tagsRes.data ?? []) as Array<{
    book_id: string | null;
    tag_id: string | null;
  }>) {
    if (!row.book_id || !row.tag_id) continue;
    const w = bookWeight.get(row.book_id) ?? 1;
    tagWeight.set(row.tag_id, (tagWeight.get(row.tag_id) ?? 0) + w);
  }

  const topTagIds = Array.from(tagWeight.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_PROFILE_TAGS)
    .map(([id]) => id);

  const topAuthors = Array.from(authorWeight.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_PROFILE_AUTHORS)
    .map(([name]) => name);

  return {
    topTagIds,
    tagWeight,
    topAuthors,
    authorWeight,
    totalSignals: bookIds.length,
  };
};

type ScoreContribution = {
  tagOverlapScore: number;
  matchingTagNames: string[];
  authorMatch: boolean;
};

const buildContributions = async (
  candidateIds: string[],
  profile: UserProfile,
): Promise<Map<string, ScoreContribution>> => {
  const contributions = new Map<string, ScoreContribution>();

  if (candidateIds.length === 0) return contributions;

  const initial: ScoreContribution = {
    tagOverlapScore: 0,
    matchingTagNames: [],
    authorMatch: false,
  };
  for (const id of candidateIds) {
    contributions.set(id, { ...initial });
  }

  // Tag overlap
  if (profile.topTagIds.length > 0) {
    const { data: relations } = await db.client
      .from("book_tags")
      .select("book_id, tag_id, tag:tag_id ( name )")
      .in("book_id", candidateIds)
      .in("tag_id", profile.topTagIds);

    for (const rel of (relations ?? []) as Array<{
      book_id: string | null;
      tag_id: string | null;
      tag?: { name?: string | null } | Array<{ name?: string | null }> | null;
    }>) {
      if (!rel.book_id || !rel.tag_id) continue;
      const entry = contributions.get(rel.book_id);
      if (!entry) continue;
      const weight = profile.tagWeight.get(rel.tag_id) ?? 0;
      entry.tagOverlapScore += weight;
      const tagObj = Array.isArray(rel.tag) ? rel.tag[0] : rel.tag;
      const name = tagObj?.name;
      if (name && !entry.matchingTagNames.includes(name)) {
        entry.matchingTagNames.push(name);
      }
    }
  }

  return contributions;
};

/**
 * Récupère les candidats de la feature /discover.
 * Score pondéré: tags + auteur + popularité + amis.
 * Exclut tout livre déjà lié à l'utilisateur (user_books, reviews, wishlist, recommendations).
 * `extraExcludeIds`: livres déjà servis à cette session (pour pagination loadMore).
 */
export const getDiscoverCandidates = async (
  userId: string,
  limit: number = DEFAULT_LIMIT,
  extraExcludeIds: string[] = [],
): Promise<DiscoverCandidate[]> => {
  if (!userId) return [];

  try {
    const [profile, excluded] = await Promise.all([
      getUserProfile(userId),
      getExcludedBookIds(userId),
    ]);

    for (const id of extraExcludeIds) excluded.add(id);

    const candidateIds = new Set<string>();

    // 1) Livres avec tags en commun
    if (profile.topTagIds.length > 0) {
      const { data: tagged } = await db.client
        .from("book_tags")
        .select("book_id")
        .in("tag_id", profile.topTagIds);
      for (const row of (tagged ?? []) as Array<{ book_id: string | null }>) {
        if (row.book_id && !excluded.has(row.book_id)) candidateIds.add(row.book_id);
      }
    }

    // 2) Livres du même auteur
    if (profile.topAuthors.length > 0) {
      const { data: sameAuthor } = await db.client
        .from("books")
        .select("id")
        .in("author", profile.topAuthors);
      for (const row of (sameAuthor ?? []) as Array<{ id: string | null }>) {
        if (row.id && !excluded.has(row.id)) candidateIds.add(row.id);
      }
    }

    // 3) Fallback: si profil vide ou pas assez de candidats, compléter avec populaires
    if (candidateIds.size < limit) {
      const { data: popular } = await db.client
        .from("books")
        .select("id")
        .order("ratings_count", { ascending: false, nullsFirst: false })
        .order("average_rating", { ascending: false, nullsFirst: false })
        .limit(CANDIDATE_POOL_SIZE);
      for (const row of (popular ?? []) as Array<{ id: string | null }>) {
        if (row.id && !excluded.has(row.id)) candidateIds.add(row.id);
        if (candidateIds.size >= CANDIDATE_POOL_SIZE) break;
      }
    }

    const candidateArray = Array.from(candidateIds).slice(0, CANDIDATE_POOL_SIZE);
    if (candidateArray.length === 0) return [];

    // 4) Fetch détails livres
    const { data: booksData } = await db.client
      .from("books")
      .select(
        "id, slug, title, author, cover_url, summary, publication_year, average_rating, ratings_count",
      )
      .in("id", candidateArray);

    if (!booksData || booksData.length === 0) return [];

    // 5) Contributions tags
    const contributions = await buildContributions(candidateArray, profile);

    // 6) Marquer auteurs match
    for (const book of booksData as BookRow[]) {
      if (book.author && profile.authorWeight.has(book.author)) {
        const entry = contributions.get(book.id);
        if (entry) entry.authorMatch = true;
      }
    }

    // 7) Notes amis
    const friendsRatings = await getFriendsRatingScore(userId, candidateArray);

    // 8) Compute scores + sort
    const maxTagWeight =
      Array.from(profile.tagWeight.values()).reduce((a, b) => a + b, 0) || 1;

    const enriched = (booksData as BookRow[]).map((book) => {
      const contrib = contributions.get(book.id) ?? {
        tagOverlapScore: 0,
        matchingTagNames: [],
        authorMatch: false,
      };

      const tagScore = Math.min(100, Math.round((contrib.tagOverlapScore / maxTagWeight) * 100));
      const authorBonus = contrib.authorMatch ? 100 : 0;
      const blendedTagAuthor = Math.max(tagScore, authorBonus * 0.8 + tagScore * 0.2);

      const popularityScore =
        typeof book.average_rating === "number"
          ? Math.round(book.average_rating * 20)
          : null;
      const friends = friendsRatings.get(book.id) ?? null;

      const compatibilityScore = computeCompatibilityScore({
        tagScore: blendedTagAuthor,
        friendsAvgRating: friends?.avgRating ?? null,
        popularityScore,
      });

      return { book, contrib, compatibilityScore, friends };
    });

    enriched.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    const top = enriched.slice(0, limit);

    // 9) Format final — résolution des covers en parallèle (sinon N round-trips Supabase Storage en série)
    const coverUrls = await Promise.all(
      top.map(({ book }) => getBookCoverUrl(book.id, book.cover_url)),
    );

    const result: DiscoverCandidate[] = top.map(
      ({ book, contrib, compatibilityScore, friends }, i) => {
        const matchReasons: DiscoverMatchReason[] = [];
        if (contrib.authorMatch) {
          matchReasons.push({ kind: "author", label: `Même auteur · ${book.author}` });
        }
        for (const tag of contrib.matchingTagNames.slice(0, 3)) {
          matchReasons.push({ kind: "tag", label: tag });
        }
        if (friends && friends.friendCount > 0) {
          const avg = friends.avgRating.toFixed(1);
          matchReasons.push({
            kind: "friends",
            label: `${friends.friendCount} ami${friends.friendCount > 1 ? "s" : ""} · ${avg}/5`,
          });
        }
        if (
          matchReasons.length === 0 &&
          typeof book.average_rating === "number" &&
          book.average_rating >= 4
        ) {
          matchReasons.push({
            kind: "popular",
            label: `Apprécié · ${book.average_rating.toFixed(1)}/5`,
          });
        }

        const displayTags = contrib.matchingTagNames.slice(0, 4).map((name, j) => ({
          id: `${book.id}-tag-${j}`,
          name,
        }));

        return {
          id: book.id,
          slug: book.slug,
          title: book.title,
          author: book.author,
          coverUrl: coverUrls[i],
          summary: book.summary,
          publicationYear: book.publication_year,
          averageRating: book.average_rating,
          ratingsCount: book.ratings_count ?? 0,
          tags: displayTags,
          compatibilityScore,
          matchReasons,
          friendsCount: friends?.friendCount ?? 0,
          friendsAvgRating: friends?.avgRating ?? null,
        };
      },
    );

    return result;
  } catch (err) {
    console.error("[discover] getDiscoverCandidates error:", err);
    return [];
  }
};
