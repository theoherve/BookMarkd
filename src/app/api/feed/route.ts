import { NextResponse } from "next/server";

import db from "@/lib/supabase/db";
import type {
  FeedActivity,
  FeedFriendBook,
  FeedRecommendation,
} from "@/features/feed/types";
import { getCurrentSession } from "@/lib/auth/session";


const ACTIVITY_TYPES: FeedActivity["type"][] = [
  "rating",
  "review",
  "status_change",
  "list_update",
  "follow",
];

const isActivityType = (value: string): value is FeedActivity["type"] => {
  return ACTIVITY_TYPES.includes(value as FeedActivity["type"]);
};

const RECOMMENDATION_SOURCES: FeedRecommendation["source"][] = [
  "friends",
  "global",
  "similar",
];

const isRecommendationSource = (
  value: string,
): value is FeedRecommendation["source"] => {
  return RECOMMENDATION_SOURCES.includes(
    value as FeedRecommendation["source"],
  );
};

const DEFAULT_ACTIVITY_LIMIT = 8;
const MAX_ACTIVITY_LIMIT = 50;
const FRIENDS_BOOKS_LIMIT = 6;
const RECOMMENDATIONS_LIMIT = 6;
const COMMUNITY_CONTENT_LIMIT = 6;

export const dynamic = "force-dynamic";

// ─── Helpers contenu communautaire ───────────────────────────────────────────

type RawBook = {
  bookId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  averageRating: number | null;
};

/** Livres les plus lus (status = finished), triés par nombre de lecteurs */
async function fetchTrendingBooks(limit: number): Promise<Array<RawBook & { readersCount: number }>> {
  const { data } = await db.client
    .from("user_books")
    .select("book_id, books(id, title, author, cover_url, average_rating)")
    .eq("status", "finished");

  if (!data) return [];

  const counts = new Map<string, RawBook & { readersCount: number }>();
  for (const row of data as unknown as Array<{
    book_id: string;
    books: { id: string; title: string; author: string; cover_url: string | null; average_rating: number | null } | null;
  }>) {
    const book = row.books;
    if (!book) continue;
    const existing = counts.get(book.id);
    if (existing) {
      existing.readersCount++;
    } else {
      counts.set(book.id, {
        bookId: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.cover_url,
        averageRating: book.average_rating,
        readersCount: 1,
      });
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.readersCount - a.readersCount)
    .slice(0, limit);
}

/** Livres les mieux notés, en excluant les livres déjà dans la liste de l'utilisateur */
async function fetchTopRatedBooks(limit: number, excludeIds: string[] = []): Promise<RawBook[]> {
  const { data } = await db.client
    .from("books")
    .select("id, title, author, cover_url, average_rating")
    .not("average_rating", "is", null)
    .order("average_rating", { ascending: false })
    .limit(limit + excludeIds.length + 10);

  if (!data) return [];

  return (data as Array<{ id: string; title: string; author: string; cover_url: string | null; average_rating: number | null }>)
    .filter((b) => !excludeIds.includes(b.id))
    .slice(0, limit)
    .map((b) => ({
      bookId: b.id,
      title: b.title,
      author: b.author,
      coverUrl: b.cover_url,
      averageRating: b.average_rating,
    }));
}

/** Livres récemment ajoutés sur la plateforme */
async function fetchRecentBooks(limit: number, excludeIds: string[] = []): Promise<RawBook[]> {
  const { data } = await db.client
    .from("books")
    .select("id, title, author, cover_url, average_rating")
    .order("created_at", { ascending: false })
    .limit(limit + excludeIds.length + 10);

  if (!data) return [];

  return (data as Array<{ id: string; title: string; author: string; cover_url: string | null; average_rating: number | null }>)
    .filter((b) => !excludeIds.includes(b.id))
    .slice(0, limit)
    .map((b) => ({
      bookId: b.id,
      title: b.title,
      author: b.author,
      coverUrl: b.cover_url,
      averageRating: b.average_rating,
    }));
}

// ─── Route GET ────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activitiesLimit = Math.min(
      Math.max(1, parseInt(searchParams.get("activitiesLimit") ?? String(DEFAULT_ACTIVITY_LIMIT), 10) || DEFAULT_ACTIVITY_LIMIT),
      MAX_ACTIVITY_LIMIT,
    );
    const activitiesOffset = Math.max(
      0,
      parseInt(searchParams.get("activitiesOffset") ?? "0", 10) || 0,
    );

    const session = await getCurrentSession();
    const viewerId = session?.user?.id ?? null;

    let followingIds: string[] = [];

    if (viewerId) {
      const { data: follows, error: followsErr } = await db.client
        .from("follows")
        .select("following_id")
        .eq("follower_id", viewerId);
      if (followsErr) throw followsErr;

      followingIds = (follows ?? []).map(
        (f) => (f as { following_id: string }).following_id,
      );
    }

    const needsCommunityContent = followingIds.length === 0;

    // ── Activités ──────────────────────────────────────────────────────────
    // Si l'utilisateur a des amis : leurs activités. Sinon : activités récentes de toute la communauté.
    const activitiesPromise = ((): Promise<{
      data: Array<{
        id: string;
        type: string;
        payload: unknown;
        createdAt: string;
        user?: { id: string; displayName: string | null; avatarUrl: string | null };
      }>;
      hasMoreActivities: boolean;
    }> => {
      let q = db.client
        .from("activities")
        .select(
          `id, type, payload, created_at, user:user_id ( id, display_name, avatar_url )`,
        )
        .order("created_at", { ascending: false })
        .range(activitiesOffset, activitiesOffset + activitiesLimit);

      if (followingIds.length > 0) {
        // Activités des amis uniquement
        q = q.in("user_id", followingIds);
      } else if (viewerId) {
        // Toute la communauté sauf soi-même
        q = q.not("user_id", "eq", viewerId);
      }
      // Si pas connecté : toute la communauté sans filtre

      return q.then((r) => {
        const data = (r.data ?? []) as unknown as Array<{
          id: string;
          type: string;
          payload: unknown;
          created_at: string;
          user?: { id: string; display_name: string | null; avatar_url: string | null };
        }>;
        const hasMore = data.length > activitiesLimit;
        const slice = data.slice(0, activitiesLimit);
        return {
          data: db.toCamel<Array<{
            id: string;
            type: string;
            payload: unknown;
            createdAt: string;
            user?: { id: string; displayName: string | null; avatarUrl: string | null };
          }>>(slice),
          hasMoreActivities: hasMore,
        };
      });
    })();

    // ── Livres des amis ────────────────────────────────────────────────────
    const friendsBooksPromise = (() => {
      if (followingIds.length === 0) return Promise.resolve([]);

      return db.client
        .from("user_books")
        .select(
          `id, status, updated_at, rating,
           user:user_id ( id, display_name, avatar_url ),
           book:book_id ( id, title, author, cover_url, average_rating )`,
        )
        .in("user_id", followingIds)
        .order("updated_at", { ascending: false })
        .limit(FRIENDS_BOOKS_LIMIT)
        .then((r) =>
          db.toCamel<Array<{
            id: string;
            status: string | null;
            updatedAt: string;
            rating: number | null;
            user?: { id: string; displayName: string | null; avatarUrl: string | null };
            book?: { id: string; title: string; author: string; coverUrl: string | null; averageRating: number | null };
          }>>(r.data ?? []),
        );
    })();

    // ── Recommandations personnalisées ─────────────────────────────────────
    const recommendationsPromise = (async () => {
      if (!viewerId) return [];

      const { data: userBooks, error: userBooksErr } = await db.client
        .from("user_books")
        .select("book_id, status")
        .eq("user_id", viewerId)
        .in("status", ["finished", "reading", "to_read"]);

      if (userBooksErr) throw userBooksErr;
      if (!userBooks || userBooks.length === 0) return [];

      const userBookIds = (userBooks ?? []).map(
        (ub) => (ub as { book_id: string }).book_id,
      ).filter((id): id is string => Boolean(id));

      if (userBookIds.length === 0) return [];

      const { data: userBookTags, error: tagsErr } = await db.client
        .from("book_tags")
        .select(`book_id, tag:tag_id ( id, name )`)
        .in("book_id", userBookIds);

      if (tagsErr) throw tagsErr;

      const tagWeights = new Map<string, number>();
      const userBookStatusMap = new Map<string, string>();

      (userBooks ?? []).forEach((ub) => {
        const bookId = (ub as { book_id: string; status: string }).book_id;
        const status = (ub as { book_id: string; status: string }).status;
        if (bookId) userBookStatusMap.set(bookId, status);
      });

      const getTagName = (tag: unknown): string | null => {
        if (!tag || typeof tag !== "object") return null;
        const t = Array.isArray(tag) ? tag[0] : (tag as { name?: string | null });
        return (t as { name?: string | null })?.name ?? null;
      };

      (userBookTags ?? []).forEach((relation) => {
        const bookId = (relation as { book_id: string | null }).book_id;
        const tag = (relation as { tag: unknown }).tag;
        const tagName = getTagName(tag);
        if (!bookId || !tagName) return;

        const status = userBookStatusMap.get(bookId) ?? "to_read";
        const weight = status === "finished" ? 3 : status === "reading" ? 2 : 1;
        tagWeights.set(tagName, (tagWeights.get(tagName) ?? 0) + weight);
      });

      if (tagWeights.size === 0) return [];

      const relevantTagNames = Array.from(tagWeights.keys());
      const { data: relevantTagIds, error: relevantTagsErr } = await db.client
        .from("tags")
        .select("id, name")
        .in("name", relevantTagNames);

      if (relevantTagsErr) throw relevantTagsErr;
      if (!relevantTagIds || relevantTagIds.length === 0) return [];

      const relevantTagIdMap = new Map(
        (relevantTagIds ?? []).map((t) => [
          (t as { name: string }).name,
          (t as { id: string }).id,
        ]),
      );

      const { data: candidateBooks, error: candidateErr } = await db.client
        .from("book_tags")
        .select(`book_id, tag:tag_id ( name )`)
        .in("tag_id", Array.from(relevantTagIdMap.values()));

      if (candidateErr) throw candidateErr;

      const bookScores = new Map<string, { score: number; matchingTags: string[] }>();

      (candidateBooks ?? []).forEach((relation) => {
        const bookId = (relation as { book_id: string | null }).book_id;
        const tag = (relation as { tag: unknown }).tag;
        const tagName = getTagName(tag);
        if (!bookId || !tagName) return;
        if (userBookIds.includes(bookId)) return;

        const tagWeight = tagWeights.get(tagName) ?? 0;
        const existing = bookScores.get(bookId);
        if (existing) {
          existing.score += tagWeight;
          if (!existing.matchingTags.includes(tagName)) existing.matchingTags.push(tagName);
        } else {
          bookScores.set(bookId, { score: tagWeight, matchingTags: [tagName] });
        }
      });

      if (bookScores.size === 0) return [];

      const sortedBookIds = Array.from(bookScores.entries())
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, RECOMMENDATIONS_LIMIT)
        .map(([bookId]) => bookId);

      if (sortedBookIds.length === 0) return [];

      const { data: recommendedBooks, error: booksErr } = await db.client
        .from("books")
        .select("id, title, author, cover_url")
        .in("id", sortedBookIds);

      if (booksErr) throw booksErr;

      const allScores = Array.from(bookScores.values()).map((s) => s.score);
      const maxScore = Math.max(...allScores);
      const minScore = Math.min(...allScores);
      const scoreRange = maxScore - minScore;

      return (recommendedBooks ?? []).map((book) => {
        const bookId = (book as { id: string }).id;
        const scoreData = bookScores.get(bookId);
        const rawScore = scoreData?.score ?? 0;
        const normalizedScore = scoreRange === 0
          ? 50
          : Math.round(((rawScore - minScore) / scoreRange) * 100);

        return {
          id: `tag-recommendation-${bookId}`,
          score: normalizedScore,
          source: "similar",
          metadata: {
            reason: `Basé sur ${scoreData?.matchingTags.length ?? 0} tag(s) en commun : ${(scoreData?.matchingTags ?? []).slice(0, 3).join(", ")}`,
            matchingTags: scoreData?.matchingTags ?? [],
          },
          book: {
            id: (book as { id: string }).id,
            title: (book as { title: string }).title,
            author: (book as { author: string }).author,
            coverUrl: (book as { cover_url: string | null }).cover_url,
          },
        };
      });
    })();

    // ── Contenu communautaire (en parallèle, uniquement si pas d'amis) ─────
    const trendingBooksPromise = needsCommunityContent
      ? fetchTrendingBooks(COMMUNITY_CONTENT_LIMIT)
      : Promise.resolve([] as Awaited<ReturnType<typeof fetchTrendingBooks>>);

    const recentBooksPromise = needsCommunityContent
      ? fetchRecentBooks(COMMUNITY_CONTENT_LIMIT)
      : Promise.resolve([] as RawBook[]);

    const [activitiesResult, friendsBooks, recommendationsRaw, trendingBooksRaw, recentBooksRaw] =
      await Promise.all([
        activitiesPromise,
        friendsBooksPromise,
        recommendationsPromise,
        trendingBooksPromise,
        recentBooksPromise,
      ]);

    const activities = activitiesResult.data;
    const hasMoreActivities = activitiesResult.hasMoreActivities;

    // Livres mieux notés : uniquement si pas de recommandations personnalisées
    const userBooksForExclusion: string[] = [];
    if (viewerId && (recommendationsRaw ?? []).length === 0) {
      const { data: ub } = await db.client
        .from("user_books")
        .select("book_id")
        .eq("user_id", viewerId);
      if (ub) {
        for (const row of ub as Array<{ book_id: string }>) {
          if (row.book_id) userBooksForExclusion.push(row.book_id);
        }
      }
    }

    const topRatedBooksRaw = (recommendationsRaw ?? []).length === 0
      ? await fetchTopRatedBooks(COMMUNITY_CONTENT_LIMIT, userBooksForExclusion)
      : [] as RawBook[];

    // ── Collecte de tous les IDs de livres à enrichir ──────────────────────
    const recommendations = (recommendationsRaw ?? []) as Array<{
      id: string;
      score: number;
      source: string;
      metadata: unknown;
      book?: { id: string; title: string; author: string; coverUrl: string | null };
    }>;

    const allEnrichmentBookIds = [
      ...recommendations.map((item) => item.book?.id).filter((id): id is string => Boolean(id)),
      ...trendingBooksRaw.map((b) => b.bookId),
      ...topRatedBooksRaw.map((b) => b.bookId),
      ...recentBooksRaw.map((b) => b.bookId),
    ];

    // ── Viewer readlist ────────────────────────────────────────────────────
    let viewerReadlistBooks = new Set<string>();
    if (viewerId && allEnrichmentBookIds.length > 0) {
      const { data: viewerEntries, error: viewerErr } = await db.client
        .from("user_books")
        .select("book_id")
        .eq("user_id", viewerId)
        .in("book_id", allEnrichmentBookIds);
      if (viewerErr) throw viewerErr;
      viewerReadlistBooks = new Set(
        (viewerEntries ?? [])
          .map((e) => (e as { book_id?: string }).book_id)
          .filter((id): id is string => Boolean(id)),
      );
    }

    // ── Contexte amis pour les recommandations ─────────────────────────────
    const friendContextByBook = new Map<string, { names: string[]; count: number; highlights: string[] }>();
    const recommendationBookIds = recommendations.map((item) => item.book?.id).filter((id): id is string => Boolean(id));

    if (followingIds.length > 0 && recommendationBookIds.length > 0) {
      const { data: friendEntries, error: friendErr } = await db.client
        .from("user_books")
        .select(`status, book_id, user:user_id ( id, display_name )`)
        .in("user_id", followingIds)
        .in("book_id", recommendationBookIds);
      if (friendErr) throw friendErr;

      const friendEntriesTyped = (friendEntries ?? []) as Array<{
        status: string | null;
        book_id: string | null;
        user: Array<{ id: string; display_name: string | null }> | null;
      }>;
      friendEntriesTyped.forEach((entry) => {
        const bookId = entry.book_id ?? undefined;
        if (!bookId) return;
        const friendName = Array.isArray(entry.user) ? entry.user[0]?.display_name ?? null : null;
        if (!friendName) return;

        const statusLabel =
          (entry.status ?? "") === "finished"
            ? `${friendName} l'a terminé`
            : (entry.status ?? "") === "reading"
              ? `${friendName} est en cours de lecture`
              : `${friendName} l'a ajouté à sa liste`;

        const existing = friendContextByBook.get(bookId);
        if (existing) {
          existing.names.push(friendName);
          existing.count += 1;
          if (existing.highlights.length < 3) existing.highlights.push(statusLabel);
        } else {
          friendContextByBook.set(bookId, { names: [friendName], count: 1, highlights: [statusLabel] });
        }
      });
    }

    // ── Tags par livre ─────────────────────────────────────────────────────
    const tagsByBook = new Map<string, string[]>();
    if (allEnrichmentBookIds.length > 0) {
      const { data: tagRelations, error: tagsErr } = await db.client
        .from("book_tags")
        .select("book_id, tag:tag_id ( name )")
        .in("book_id", allEnrichmentBookIds);
      if (tagsErr) throw tagsErr;

      const getTagNameFromRelation = (tag: unknown): string | undefined => {
        if (!tag || typeof tag !== "object") return undefined;
        const t = Array.isArray(tag) ? tag[0] : (tag as { name?: string | null });
        return (t as { name?: string | null })?.name ?? undefined;
      };

      (tagRelations ?? []).forEach((relation) => {
        const bookId = (relation as { book_id: string | null }).book_id ?? undefined;
        const tagName = getTagNameFromRelation((relation as { tag: unknown }).tag);
        if (!bookId || !tagName) return;
        const existing = tagsByBook.get(bookId);
        if (existing) { existing.push(tagName); } else { tagsByBook.set(bookId, [tagName]); }
      });
    }

    // ── Lecteurs par livre ─────────────────────────────────────────────────
    const readersByBook = new Map<string, Array<{
      id: string; username: string | null; displayName: string; avatarUrl: string | null;
      status: "to_read" | "reading" | "finished";
    }>>();
    if (allEnrichmentBookIds.length > 0) {
      const { data: bookReadersData, error: readersErr } = await db.client
        .from("user_books")
        .select(`book_id, status, user_id, user:user_id ( id, username, display_name, avatar_url )`)
        .in("book_id", allEnrichmentBookIds)
        .order("updated_at", { ascending: false });

      if (readersErr) {
        console.error("[feed] Error fetching book readers:", readersErr);
      }

      if (bookReadersData && bookReadersData.length > 0) {
        const userBooks = db.toCamel<Array<{
          bookId: string;
          status: "to_read" | "reading" | "finished";
          userId: string;
          user?: { id: string; username: string | null; displayName: string; avatarUrl: string | null };
        }>>(bookReadersData ?? []);

        userBooks.forEach((ub) => {
          const bookId = ub.bookId;
          if (!bookId || !ub.user) return;
          const existing = readersByBook.get(bookId) ?? [];
          if (existing.length < 5) {
            existing.push({
              id: ub.user.id,
              username: ub.user.username,
              displayName: ub.user.displayName,
              avatarUrl: ub.user.avatarUrl,
              status: ub.status,
            });
            readersByBook.set(bookId, existing);
          }
        });
      }
    }

    // ── Formatage des activités ────────────────────────────────────────────
    const getPayloadValue = (p: Record<string, unknown>, key: string) => {
      const camel = p[key.replace(/_([a-z])/g, (_m, c) => c.toUpperCase())];
      const snake = p[key];
      return camel ?? snake;
    };

    const bookIdsToFetch = new Set<string>();
    activities.forEach((item) => {
      const payload = item.payload ?? {};
      const normalizedPayload =
        typeof payload === "object" && payload !== null && !Array.isArray(payload)
          ? (payload as Record<string, unknown>)
          : {};
      const bookId = getPayloadValue(normalizedPayload, "book_id") as string | null | undefined;
      const bookTitle = getPayloadValue(normalizedPayload, "book_title") as string | null | undefined;
      const bookAuthor = getPayloadValue(normalizedPayload, "book_author") as string | null | undefined;
      if (bookId && (!bookTitle || !bookAuthor)) bookIdsToFetch.add(bookId);
    });

    const bookDetailsMap = new Map<string, { title: string; author: string }>();
    if (bookIdsToFetch.size > 0) {
      const { data: books, error: booksError } = await db.client
        .from("books")
        .select("id, title, author")
        .in("id", Array.from(bookIdsToFetch));
      if (!booksError && books) {
        (books as Array<{ id: string; title: string; author: string }>).forEach((book) => {
          bookDetailsMap.set(book.id, { title: book.title, author: book.author });
        });
      }
    }

    const filteredActivities = activities.filter((item) => {
      if (item.type === "review") {
        const payload = item.payload ?? {};
        const normalizedPayload =
          typeof payload === "object" && payload !== null && !Array.isArray(payload)
            ? (payload as Record<string, unknown>)
            : {};
        const visibility = getPayloadValue(normalizedPayload, "visibility") as string | null | undefined;
        if (visibility === "private") return false;
      }
      return true;
    });

    const formattedActivities: FeedActivity[] = filteredActivities.map((item) => {
      const payload = item.payload ?? {};
      const normalizedPayload =
        typeof payload === "object" && payload !== null && !Array.isArray(payload)
          ? (payload as Record<string, unknown>)
          : {};

      const bookId = getPayloadValue(normalizedPayload, "book_id") as string | null | undefined;
      const bookTitleFromPayload = getPayloadValue(normalizedPayload, "book_title") as string | null | undefined;
      const bookAuthorFromPayload = getPayloadValue(normalizedPayload, "book_author") as string | null | undefined;
      const bookDetails = bookId ? bookDetailsMap.get(bookId) : undefined;
      const bookTitle = bookTitleFromPayload ?? (bookDetails?.title ?? null) ?? null;
      const bookAuthor = bookAuthorFromPayload ?? (bookDetails?.author ?? null) ?? null;
      const note =
        (getPayloadValue(normalizedPayload, "note") as string | null | undefined) ??
        (getPayloadValue(normalizedPayload, "review_snippet") as string | null | undefined) ??
        (getPayloadValue(normalizedPayload, "status_note") as string | null | undefined) ??
        null;
      const rating = getPayloadValue(normalizedPayload, "rating") as number | null | undefined;

      return {
        id: item.id,
        type: isActivityType(item.type) ? item.type : "list_update",
        userName: item.user?.displayName ?? "Lectrice anonyme",
        userAvatarUrl: item.user?.avatarUrl ?? null,
        bookId: bookId ?? null,
        bookTitle,
        bookAuthor,
        note,
        rating: rating ?? null,
        occurredAt: item.createdAt,
      };
    });

    // ── Formatage des livres d'amis ────────────────────────────────────────
    const formattedFriendsBooks: FeedFriendBook[] = friendsBooks.map((item) => ({
      id: item.id,
      bookId: item.book?.id ?? "",
      title: item.book?.title ?? "",
      author: item.book?.author ?? "",
      coverUrl: item.book?.coverUrl ?? null,
      averageRating: typeof item.book?.averageRating === "number" ? item.book!.averageRating! : null,
      status: item.status as "to_read" | "reading" | "finished",
      updatedAt: item.updatedAt,
      readerName: item.user?.displayName ?? "Lectrice anonyme",
      readerAvatarUrl: item.user?.avatarUrl ?? null,
    }));

    // ── Formatage des recommandations personnalisées ───────────────────────
    const formattedRecommendations: FeedRecommendation[] = recommendations.map((item) => {
      const bookId = item.book?.id ?? "";
      const friendContext = friendContextByBook.get(bookId);
      const metadata = item.metadata ?? {};
      const normalizedMetadata =
        typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)
          ? (metadata as Record<string, unknown>)
          : {};
      const tags = tagsByBook.get(bookId) ?? [];
      const readers = readersByBook.get(bookId) ?? [];

      return {
        id: item.id,
        bookId,
        title: item.book?.title ?? "",
        author: item.book?.author ?? "",
        coverUrl: item.book?.coverUrl ?? null,
        reason:
          (normalizedMetadata.reason as string | null | undefined) ??
          (normalizedMetadata.explanation as string | null | undefined) ??
          (normalizedMetadata.match as string | null | undefined) ??
          (friendContext ? `${friendContext.names.slice(0, 2).join(", ")} l'a recommandé` : null),
        source: isRecommendationSource(item.source) ? item.source : "global",
        score: typeof item.score === "number" ? item.score : Number(item.score ?? 0),
        friendNames: friendContext?.names ?? [],
        friendCount: friendContext?.count ?? 0,
        viewerHasInReadlist: viewerReadlistBooks.has(bookId),
        friendHighlights: friendContext?.highlights ?? [],
        tags: tags.slice(0, 5),
        readers,
      };
    });

    // ── Formatage du contenu communautaire ────────────────────────────────

    /** Mappe un RawBook vers FeedRecommendation pour l'affichage communautaire */
    const mapRawBookToRecommendation = (
      book: RawBook,
      prefix: string,
      reason: string,
      scoreLabel: string,
      score: number,
    ): FeedRecommendation => ({
      id: `${prefix}-${book.bookId}`,
      bookId: book.bookId,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      reason,
      source: "global",
      score,
      scoreLabel,
      viewerHasInReadlist: viewerReadlistBooks.has(book.bookId),
      tags: (tagsByBook.get(book.bookId) ?? []).slice(0, 5),
      readers: readersByBook.get(book.bookId) ?? [],
      friendNames: [],
      friendCount: 0,
      friendHighlights: [],
    });

    const formattedTrendingBooks: FeedRecommendation[] = trendingBooksRaw.map((book) => {
      const count = book.readersCount;
      const label = `${count} lecteur·ice${count > 1 ? "s" : ""} l'ont terminé`;
      return mapRawBookToRecommendation(book, "trending", label, label, count);
    });

    const formattedTopRatedBooks: FeedRecommendation[] = topRatedBooksRaw.map((book) => {
      const avg = book.averageRating ?? 0;
      const label = `Note : ${avg.toFixed(1)}/5`;
      return mapRawBookToRecommendation(book, "top-rated", label, label, Math.round(avg * 20));
    });

    const formattedRecentBooks: FeedRecommendation[] = recentBooksRaw.map((book) =>
      mapRawBookToRecommendation(
        book,
        "recent",
        "Récemment ajouté·e sur BookMarkd",
        "", // scoreLabel vide = badge masqué
        0,
      ),
    );

    return NextResponse.json({
      activities: formattedActivities,
      friendsBooks: formattedFriendsBooks,
      recommendations: formattedRecommendations,
      hasMoreActivities,
      activitiesSource: needsCommunityContent ? "community" : "friends",
      trendingBooks: formattedTrendingBooks.length > 0 ? formattedTrendingBooks : undefined,
      topRatedBooks: formattedTopRatedBooks.length > 0 ? formattedTopRatedBooks : undefined,
      recentBooks: formattedRecentBooks.length > 0 ? formattedRecentBooks : undefined,
    });
  } catch (error) {
    console.error("[feed] GET error:", error);
    return NextResponse.json(
      { error: "Unable to fetch feed data." },
      { status: 500 },
    );
  }
}
