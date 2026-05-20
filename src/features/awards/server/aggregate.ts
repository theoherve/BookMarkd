import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type AggregatedAward,
  type AggregationResult,
  type AwardsYearSummary,
  type BookSnapshot,
  type FeelingBookSnapshot,
  type ReviewSnapshot,
  type TagSnapshot,
  type UserSnapshot,
  MIN_AWARDS_YEAR,
  NEWCOMER_MIN_FINISHED,
  TOP_N,
} from "../types";
import {
  type BookCandidate,
  type NewcomerCandidate,
  type ReaderCandidate,
  type ReviewerCandidate,
  compareByScoreThenCreatedAt,
  round,
  scoreBestNewcomer,
  scoreBookOfTheYear,
  scoreReaderOfTheYear,
  scoreTopReviewer,
} from "./scoring";

type Client = SupabaseClient;

const yearWindow = (year: number) => ({
  start: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)).toISOString(),
  end: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)).toISOString(),
});

export class AwardsYearGuardError extends Error {
  constructor(year: number) {
    super(
      `Awards aggregation refused for year ${year}: min year is ${MIN_AWARDS_YEAR}.`,
    );
    this.name = "AwardsYearGuardError";
  }
}

export const assertYearAllowed = (year: number) => {
  if (year < MIN_AWARDS_YEAR) {
    throw new AwardsYearGuardError(year);
  }
};

const truncate = (value: string, max = 200) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

// ─── Book of the Year ───────────────────────────────────────────────────────

const computeBookOfTheYear = async (
  supabase: Client,
  year: number,
): Promise<AggregatedAward[]> => {
  const { start, end } = yearWindow(year);

  const { data, error } = await supabase
    .from("user_books")
    .select("book_id, rating, updated_at")
    .eq("status", "finished")
    .gte("updated_at", start)
    .lte("updated_at", end);

  if (error) throw error;

  const byBook = new Map<string, BookCandidate>();
  for (const row of data ?? []) {
    const bookId = row.book_id as string;
    const rating = (row.rating as number | null) ?? null;
    const updatedAt = row.updated_at as string;
    const current =
      byBook.get(bookId) ??
      ({
        bookId,
        finishCount: 0,
        avgRating: 0,
        ratingCount: 0,
        earliestFinishedAt: updatedAt,
        sumRating: 0,
      } as BookCandidate & { sumRating: number });

    current.finishCount += 1;
    if (rating !== null && Number.isFinite(rating)) {
      (current as BookCandidate & { sumRating: number }).sumRating += rating;
      current.ratingCount += 1;
    }
    if (new Date(updatedAt) < new Date(current.earliestFinishedAt)) {
      current.earliestFinishedAt = updatedAt;
    }
    byBook.set(bookId, current);
  }

  if (byBook.size === 0) return [];

  const scored = Array.from(byBook.values()).map((c) => {
    const raw = c as BookCandidate & { sumRating: number };
    const avgRating = raw.ratingCount > 0 ? raw.sumRating / raw.ratingCount : 0;
    const candidate: BookCandidate = { ...raw, avgRating };
    return {
      candidate,
      score: scoreBookOfTheYear(candidate),
      createdAt: candidate.earliestFinishedAt,
    };
  });

  scored.sort(compareByScoreThenCreatedAt);
  const top = scored.slice(0, TOP_N);
  if (top.length === 0) return [];

  const bookIds = top.map((s) => s.candidate.bookId);
  const { data: books, error: booksError } = await supabase
    .from("books")
    .select("id, title, author, cover_url, slug")
    .in("id", bookIds);
  if (booksError) throw booksError;

  const bookMap = new Map<string, (typeof books)[number]>();
  for (const b of books ?? []) bookMap.set(b.id as string, b);

  return top
    .map((s, idx): AggregatedAward | null => {
      const book = bookMap.get(s.candidate.bookId);
      if (!book) return null;
      const snapshot: BookSnapshot = {
        type: "book",
        title: book.title as string,
        author: book.author as string,
        coverUrl: (book.cover_url as string | null) ?? null,
        slug: (book.slug as string | null) ?? null,
      };
      return {
        category: "book_of_the_year",
        rank: idx + 1,
        winnerType: "book",
        winnerId: s.candidate.bookId,
        snapshot,
        score: round(s.score),
        metadata: {
          finishCount: s.candidate.finishCount,
          avgRating: round(s.candidate.avgRating, 2),
          ratingCount: s.candidate.ratingCount,
        },
      };
    })
    .filter((x): x is AggregatedAward => x !== null);
};

// ─── Reader of the Year ─────────────────────────────────────────────────────

const computeReaderOfTheYear = async (
  supabase: Client,
  year: number,
): Promise<AggregatedAward[]> => {
  const { start, end } = yearWindow(year);

  const { data: finished, error } = await supabase
    .from("user_books")
    .select("user_id, updated_at")
    .eq("status", "finished")
    .gte("updated_at", start)
    .lte("updated_at", end);
  if (error) throw error;

  const byUser = new Map<string, ReaderCandidate>();
  for (const row of finished ?? []) {
    const userId = row.user_id as string;
    const updatedAt = row.updated_at as string;
    const current =
      byUser.get(userId) ??
      ({
        userId,
        finishCount: 0,
        reviewsWritten: 0,
        listsCreated: 0,
        earliestFinishedAt: updatedAt,
      } satisfies ReaderCandidate);
    current.finishCount += 1;
    if (new Date(updatedAt) < new Date(current.earliestFinishedAt)) {
      current.earliestFinishedAt = updatedAt;
    }
    byUser.set(userId, current);
  }

  if (byUser.size === 0) return [];

  const userIds = Array.from(byUser.keys());

  const [reviewsRes, listsRes] = await Promise.all([
    supabase
      .from("reviews")
      .select("user_id")
      .in("user_id", userIds)
      .gte("created_at", start)
      .lte("created_at", end),
    supabase
      .from("lists")
      .select("owner_id")
      .in("owner_id", userIds)
      .gte("created_at", start)
      .lte("created_at", end),
  ]);

  for (const row of reviewsRes.data ?? []) {
    const userId = row.user_id as string;
    const c = byUser.get(userId);
    if (c) c.reviewsWritten += 1;
  }
  for (const row of listsRes.data ?? []) {
    const userId = row.owner_id as string;
    const c = byUser.get(userId);
    if (c) c.listsCreated += 1;
  }

  const scored = Array.from(byUser.values()).map((c) => ({
    candidate: c,
    score: scoreReaderOfTheYear(c),
    createdAt: c.earliestFinishedAt,
  }));
  scored.sort(compareByScoreThenCreatedAt);
  const top = scored.slice(0, TOP_N);

  return resolveUserAwards(supabase, top, "reader_of_the_year", (s) => ({
    finishCount: s.candidate.finishCount,
    reviewsWritten: s.candidate.reviewsWritten,
    listsCreated: s.candidate.listsCreated,
  }));
};

// ─── Top Categories ─────────────────────────────────────────────────────────

const computeTopCategories = async (
  supabase: Client,
  year: number,
): Promise<AggregatedAward[]> => {
  const { start, end } = yearWindow(year);

  const { data: finished, error } = await supabase
    .from("user_books")
    .select("book_id, user_id, updated_at")
    .eq("status", "finished")
    .gte("updated_at", start)
    .lte("updated_at", end);
  if (error) throw error;

  if (!finished || finished.length === 0) return [];

  const bookIds = Array.from(new Set(finished.map((r) => r.book_id as string)));

  const { data: bookTags, error: btError } = await supabase
    .from("book_tags")
    .select("book_id, tag_id")
    .in("book_id", bookIds);
  if (btError) throw btError;
  if (!bookTags || bookTags.length === 0) return [];

  const tagToBooks = new Map<string, Set<string>>();
  for (const bt of bookTags) {
    const tagId = bt.tag_id as string;
    const bookId = bt.book_id as string;
    if (!tagToBooks.has(tagId)) tagToBooks.set(tagId, new Set());
    tagToBooks.get(tagId)!.add(bookId);
  }

  // Count finished events per tag (sum over books with tag, with multiplicity)
  type TagAgg = {
    tagId: string;
    finishCount: number;
    uniqueReaders: Set<string>;
    earliestAt: string;
  };
  const byTag = new Map<string, TagAgg>();
  for (const row of finished) {
    const bookId = row.book_id as string;
    const userId = row.user_id as string;
    const updatedAt = row.updated_at as string;
    for (const [tagId, books] of tagToBooks.entries()) {
      if (!books.has(bookId)) continue;
      const agg =
        byTag.get(tagId) ??
        ({
          tagId,
          finishCount: 0,
          uniqueReaders: new Set<string>(),
          earliestAt: updatedAt,
        } satisfies TagAgg);
      agg.finishCount += 1;
      agg.uniqueReaders.add(userId);
      if (new Date(updatedAt) < new Date(agg.earliestAt)) {
        agg.earliestAt = updatedAt;
      }
      byTag.set(tagId, agg);
    }
  }

  if (byTag.size === 0) return [];

  const scored = Array.from(byTag.values()).map((t) => ({
    tagId: t.tagId,
    score: t.finishCount,
    createdAt: t.earliestAt,
    uniqueReaders: t.uniqueReaders.size,
    finishCount: t.finishCount,
  }));
  scored.sort(compareByScoreThenCreatedAt);
  const top = scored.slice(0, TOP_N);

  const { data: tags, error: tagsError } = await supabase
    .from("tags")
    .select("id, name, slug")
    .in(
      "id",
      top.map((t) => t.tagId),
    );
  if (tagsError) throw tagsError;

  const tagMap = new Map<string, (typeof tags)[number]>();
  for (const t of tags ?? []) tagMap.set(t.id as string, t);

  return top
    .map((s, idx): AggregatedAward | null => {
      const tag = tagMap.get(s.tagId);
      if (!tag) return null;
      const snapshot: TagSnapshot = {
        type: "tag",
        name: tag.name as string,
        slug: tag.slug as string,
      };
      return {
        category: "top_categories",
        rank: idx + 1,
        winnerType: "tag",
        winnerId: s.tagId,
        snapshot,
        score: round(s.score),
        metadata: {
          finishCount: s.finishCount,
          uniqueReaders: s.uniqueReaders,
        },
      };
    })
    .filter((x): x is AggregatedAward => x !== null);
};

// ─── Top Reviewer ───────────────────────────────────────────────────────────

const computeTopReviewer = async (
  supabase: Client,
  year: number,
): Promise<AggregatedAward[]> => {
  const { start, end } = yearWindow(year);

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, user_id, created_at")
    .eq("visibility", "public")
    .gte("created_at", start)
    .lte("created_at", end);
  if (error) throw error;
  if (!reviews || reviews.length === 0) return [];

  const reviewIdToUser = new Map<string, string>();
  const byUser = new Map<string, ReviewerCandidate>();
  for (const r of reviews) {
    const userId = r.user_id as string;
    const id = r.id as string;
    const createdAt = r.created_at as string;
    reviewIdToUser.set(id, userId);
    const c =
      byUser.get(userId) ??
      ({
        userId,
        reviewCount: 0,
        likesReceived: 0,
        earliestReviewAt: createdAt,
      } satisfies ReviewerCandidate);
    c.reviewCount += 1;
    if (new Date(createdAt) < new Date(c.earliestReviewAt)) {
      c.earliestReviewAt = createdAt;
    }
    byUser.set(userId, c);
  }

  const reviewIds = Array.from(reviewIdToUser.keys());
  if (reviewIds.length > 0) {
    const { data: likes, error: likesError } = await supabase
      .from("review_likes")
      .select("review_id, created_at")
      .in("review_id", reviewIds)
      .gte("created_at", start)
      .lte("created_at", end);
    if (likesError) throw likesError;
    for (const lk of likes ?? []) {
      const userId = reviewIdToUser.get(lk.review_id as string);
      if (!userId) continue;
      const c = byUser.get(userId);
      if (c) c.likesReceived += 1;
    }
  }

  const scored = Array.from(byUser.values()).map((c) => ({
    candidate: c,
    score: scoreTopReviewer(c),
    createdAt: c.earliestReviewAt,
  }));
  scored.sort(compareByScoreThenCreatedAt);
  const top = scored.slice(0, TOP_N);

  return resolveUserAwards(supabase, top, "top_reviewer", (s) => ({
    reviewCount: s.candidate.reviewCount,
    likesReceived: s.candidate.likesReceived,
  }));
};

// ─── Most Loved Review ──────────────────────────────────────────────────────

const computeMostLovedReview = async (
  supabase: Client,
  year: number,
): Promise<AggregatedAward[]> => {
  const { start, end } = yearWindow(year);

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, user_id, book_id, title, content, created_at")
    .eq("visibility", "public")
    .gte("created_at", start)
    .lte("created_at", end);
  if (error) throw error;
  if (!reviews || reviews.length === 0) return [];

  const reviewIds = reviews.map((r) => r.id as string);
  const { data: likes, error: likesError } = await supabase
    .from("review_likes")
    .select("review_id")
    .in("review_id", reviewIds);
  if (likesError) throw likesError;

  const likeCounts = new Map<string, number>();
  for (const lk of likes ?? []) {
    const rid = lk.review_id as string;
    likeCounts.set(rid, (likeCounts.get(rid) ?? 0) + 1);
  }

  const scored = reviews.map((r) => ({
    review: r,
    score: likeCounts.get(r.id as string) ?? 0,
    createdAt: r.created_at as string,
  }));
  scored.sort(compareByScoreThenCreatedAt);
  const top = scored.filter((s) => s.score > 0).slice(0, TOP_N);
  if (top.length === 0) return [];

  const bookIds = Array.from(
    new Set(top.map((s) => s.review.book_id as string)),
  );
  const userIds = Array.from(
    new Set(top.map((s) => s.review.user_id as string)),
  );

  const [booksRes, usersRes] = await Promise.all([
    supabase.from("books").select("id, title, slug, cover_url").in("id", bookIds),
    supabase
      .from("users")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds),
  ]);

  const bookMap = new Map<string, NonNullable<typeof booksRes.data>[number]>();
  for (const b of booksRes.data ?? []) bookMap.set(b.id as string, b);
  const userMap = new Map<string, NonNullable<typeof usersRes.data>[number]>();
  for (const u of usersRes.data ?? []) userMap.set(u.id as string, u);

  return top
    .map((s, idx): AggregatedAward | null => {
      const book = bookMap.get(s.review.book_id as string);
      const author = userMap.get(s.review.user_id as string);
      if (!book || !author) return null;
      const snapshot: ReviewSnapshot = {
        type: "review",
        title: (s.review.title as string | null) ?? null,
        excerpt: truncate((s.review.content as string) ?? "", 200),
        bookTitle: book.title as string,
        bookSlug: (book.slug as string | null) ?? null,
        bookCoverUrl: (book.cover_url as string | null) ?? null,
        authorDisplayName: author.display_name as string,
        authorUsername: (author.username as string | null) ?? null,
        authorAvatarUrl: (author.avatar_url as string | null) ?? null,
      };
      return {
        category: "most_loved_review",
        rank: idx + 1,
        winnerType: "review",
        winnerId: s.review.id as string,
        snapshot,
        score: round(s.score),
        metadata: { likeCount: s.score, authorId: s.review.user_id },
      };
    })
    .filter((x): x is AggregatedAward => x !== null);
};

// ─── Trending Wishlist ──────────────────────────────────────────────────────

const computeTrendingWishlist = async (
  supabase: Client,
  year: number,
): Promise<AggregatedAward[]> => {
  const { start, end } = yearWindow(year);

  const { data, error } = await supabase
    .from("discover_wishlist")
    .select("book_id, created_at")
    .gte("created_at", start)
    .lte("created_at", end);
  if (error) throw error;
  if (!data || data.length === 0) return [];

  type Agg = { bookId: string; count: number; earliestAt: string };
  const byBook = new Map<string, Agg>();
  for (const row of data) {
    const bookId = row.book_id as string;
    const createdAt = row.created_at as string;
    const a =
      byBook.get(bookId) ?? { bookId, count: 0, earliestAt: createdAt };
    a.count += 1;
    if (new Date(createdAt) < new Date(a.earliestAt)) a.earliestAt = createdAt;
    byBook.set(bookId, a);
  }

  const scored = Array.from(byBook.values()).map((a) => ({
    bookId: a.bookId,
    score: a.count,
    createdAt: a.earliestAt,
    count: a.count,
  }));
  scored.sort(compareByScoreThenCreatedAt);
  const top = scored.slice(0, TOP_N);

  const { data: books, error: booksError } = await supabase
    .from("books")
    .select("id, title, author, cover_url, slug")
    .in(
      "id",
      top.map((t) => t.bookId),
    );
  if (booksError) throw booksError;

  const bookMap = new Map<string, (typeof books)[number]>();
  for (const b of books ?? []) bookMap.set(b.id as string, b);

  return top
    .map((s, idx): AggregatedAward | null => {
      const book = bookMap.get(s.bookId);
      if (!book) return null;
      const snapshot: BookSnapshot = {
        type: "book",
        title: book.title as string,
        author: book.author as string,
        coverUrl: (book.cover_url as string | null) ?? null,
        slug: (book.slug as string | null) ?? null,
      };
      return {
        category: "trending_wishlist",
        rank: idx + 1,
        winnerType: "book",
        winnerId: s.bookId,
        snapshot,
        score: round(s.score),
        metadata: { wishlistCount: s.count },
      };
    })
    .filter((x): x is AggregatedAward => x !== null);
};

// ─── Best Newcomer ──────────────────────────────────────────────────────────

const computeBestNewcomer = async (
  supabase: Client,
  year: number,
): Promise<AggregatedAward[]> => {
  const { start, end } = yearWindow(year);

  const { data: users, error } = await supabase
    .from("users")
    .select("id, created_at")
    .gte("created_at", start)
    .lte("created_at", end);
  if (error) throw error;
  if (!users || users.length === 0) return [];

  const userIds = users.map((u) => u.id as string);
  const joinMap = new Map<string, string>();
  for (const u of users) joinMap.set(u.id as string, u.created_at as string);

  const [finishedRes, reviewsRes] = await Promise.all([
    supabase
      .from("user_books")
      .select("user_id, updated_at")
      .eq("status", "finished")
      .in("user_id", userIds)
      .gte("updated_at", start)
      .lte("updated_at", end),
    supabase
      .from("reviews")
      .select("user_id")
      .in("user_id", userIds)
      .gte("created_at", start)
      .lte("created_at", end),
  ]);

  const finishCount = new Map<string, number>();
  for (const row of finishedRes.data ?? []) {
    const userId = row.user_id as string;
    finishCount.set(userId, (finishCount.get(userId) ?? 0) + 1);
  }
  const reviewsCount = new Map<string, number>();
  for (const row of reviewsRes.data ?? []) {
    const userId = row.user_id as string;
    reviewsCount.set(userId, (reviewsCount.get(userId) ?? 0) + 1);
  }

  const candidates: NewcomerCandidate[] = userIds
    .map((userId) => ({
      userId,
      joinedAt: joinMap.get(userId) ?? new Date().toISOString(),
      finishCount: finishCount.get(userId) ?? 0,
      reviewsWritten: reviewsCount.get(userId) ?? 0,
    }))
    .filter((c) => c.finishCount >= NEWCOMER_MIN_FINISHED);

  if (candidates.length === 0) return [];

  const scored = candidates.map((c) => ({
    candidate: c,
    score: scoreBestNewcomer(c),
    createdAt: c.joinedAt,
  }));
  scored.sort(compareByScoreThenCreatedAt);
  const top = scored.slice(0, TOP_N);

  return resolveUserAwards(supabase, top, "best_newcomer", (s) => ({
    finishCount: s.candidate.finishCount,
    reviewsWritten: s.candidate.reviewsWritten,
    joinedAt: s.candidate.joinedAt,
  }));
};

// ─── Feeling Award ──────────────────────────────────────────────────────────

const computeFeelingAward = async (
  supabase: Client,
  year: number,
): Promise<AggregatedAward[]> => {
  const { start, end } = yearWindow(year);

  const { data: feelings, error } = await supabase
    .from("user_book_feelings")
    .select("book_id, keyword_id, user_id, created_at")
    .eq("visibility", "public")
    .gte("created_at", start)
    .lte("created_at", end);
  if (error) throw error;
  if (!feelings || feelings.length === 0) return [];

  type Agg = {
    bookId: string;
    keywordId: string;
    uniqueUsers: Set<string>;
    earliestAt: string;
  };
  const byPair = new Map<string, Agg>();
  for (const row of feelings) {
    const bookId = row.book_id as string;
    const keywordId = row.keyword_id as string;
    const userId = row.user_id as string;
    const createdAt = row.created_at as string;
    const key = `${bookId}::${keywordId}`;
    const agg =
      byPair.get(key) ??
      ({
        bookId,
        keywordId,
        uniqueUsers: new Set<string>(),
        earliestAt: createdAt,
      } satisfies Agg);
    agg.uniqueUsers.add(userId);
    if (new Date(createdAt) < new Date(agg.earliestAt)) {
      agg.earliestAt = createdAt;
    }
    byPair.set(key, agg);
  }

  const scored = Array.from(byPair.values()).map((a) => ({
    bookId: a.bookId,
    keywordId: a.keywordId,
    score: a.uniqueUsers.size,
    createdAt: a.earliestAt,
    uniqueUsers: a.uniqueUsers.size,
  }));
  scored.sort(compareByScoreThenCreatedAt);
  const top = scored.slice(0, TOP_N);
  if (top.length === 0) return [];

  const bookIds = Array.from(new Set(top.map((s) => s.bookId)));
  const keywordIds = Array.from(new Set(top.map((s) => s.keywordId)));

  const [booksRes, keywordsRes] = await Promise.all([
    supabase
      .from("books")
      .select("id, title, author, cover_url, slug")
      .in("id", bookIds),
    supabase
      .from("feeling_keywords")
      .select("id, label, slug")
      .in("id", keywordIds),
  ]);

  const bookMap = new Map<string, NonNullable<typeof booksRes.data>[number]>();
  for (const b of booksRes.data ?? []) bookMap.set(b.id as string, b);
  const kwMap = new Map<string, NonNullable<typeof keywordsRes.data>[number]>();
  for (const k of keywordsRes.data ?? []) kwMap.set(k.id as string, k);

  return top
    .map((s, idx): AggregatedAward | null => {
      const book = bookMap.get(s.bookId);
      const kw = kwMap.get(s.keywordId);
      if (!book || !kw) return null;
      const snapshot: FeelingBookSnapshot = {
        type: "feeling_book",
        feelingLabel: kw.label as string,
        feelingSlug: kw.slug as string,
        bookTitle: book.title as string,
        bookAuthor: book.author as string,
        bookCoverUrl: (book.cover_url as string | null) ?? null,
        bookSlug: (book.slug as string | null) ?? null,
      };
      return {
        category: "feeling_award",
        rank: idx + 1,
        winnerType: "feeling_book",
        winnerId: null,
        snapshot,
        score: round(s.score),
        metadata: {
          bookId: s.bookId,
          keywordId: s.keywordId,
          uniqueUsers: s.uniqueUsers,
        },
      };
    })
    .filter((x): x is AggregatedAward => x !== null);
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const resolveUserAwards = async <T extends { candidate: { userId: string }; score: number; createdAt: string }>(
  supabase: Client,
  top: T[],
  category: AggregatedAward["category"],
  buildMetadata: (entry: T) => Record<string, unknown>,
): Promise<AggregatedAward[]> => {
  if (top.length === 0) return [];
  const userIds = top.map((t) => t.candidate.userId);
  const { data: users, error } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url")
    .in("id", userIds);
  if (error) throw error;
  const userMap = new Map<string, (typeof users)[number]>();
  for (const u of users ?? []) userMap.set(u.id as string, u);

  return top
    .map((s, idx): AggregatedAward | null => {
      const u = userMap.get(s.candidate.userId);
      if (!u) return null;
      const snapshot: UserSnapshot = {
        type: "user",
        username: (u.username as string | null) ?? null,
        displayName: u.display_name as string,
        avatarUrl: (u.avatar_url as string | null) ?? null,
      };
      return {
        category,
        rank: idx + 1,
        winnerType: "user",
        winnerId: s.candidate.userId,
        snapshot,
        score: round(s.score),
        metadata: buildMetadata(s),
      };
    })
    .filter((x): x is AggregatedAward => x !== null);
};

// ─── Summary ────────────────────────────────────────────────────────────────

const computeSummary = async (
  supabase: Client,
  year: number,
): Promise<AwardsYearSummary> => {
  const { start, end } = yearWindow(year);

  const [finishedRes, reviewsRes, feelingsRes, newcomersRes, activeRes] =
    await Promise.all([
      supabase
        .from("user_books")
        .select("id", { count: "exact", head: true })
        .eq("status", "finished")
        .gte("updated_at", start)
        .lte("updated_at", end),
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("visibility", "public")
        .gte("created_at", start)
        .lte("created_at", end),
      supabase
        .from("user_book_feelings")
        .select("id", { count: "exact", head: true })
        .eq("visibility", "public")
        .gte("created_at", start)
        .lte("created_at", end),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .gte("created_at", start)
        .lte("created_at", end),
      supabase
        .from("user_books")
        .select("user_id")
        .eq("status", "finished")
        .gte("updated_at", start)
        .lte("updated_at", end),
    ]);

  const activeUsers = new Set<string>();
  for (const row of activeRes.data ?? []) {
    activeUsers.add(row.user_id as string);
  }

  return {
    totalBooksFinished: finishedRes.count ?? 0,
    totalUsersActive: activeUsers.size,
    totalReviewsPublished: reviewsRes.count ?? 0,
    totalFeelings: feelingsRes.count ?? 0,
    totalNewcomers: newcomersRes.count ?? 0,
  };
};

// ─── Public API ─────────────────────────────────────────────────────────────

export const computeAwardsForYear = async (
  supabase: Client,
  year: number,
): Promise<AggregationResult> => {
  assertYearAllowed(year);

  const [
    bookOfYear,
    readerOfYear,
    topCategories,
    topReviewer,
    mostLovedReview,
    trendingWishlist,
    bestNewcomer,
    feelingAward,
    summary,
  ] = await Promise.all([
    computeBookOfTheYear(supabase, year),
    computeReaderOfTheYear(supabase, year),
    computeTopCategories(supabase, year),
    computeTopReviewer(supabase, year),
    computeMostLovedReview(supabase, year),
    computeTrendingWishlist(supabase, year),
    computeBestNewcomer(supabase, year),
    computeFeelingAward(supabase, year),
    computeSummary(supabase, year),
  ]);

  return {
    year,
    summary,
    winners: [
      ...bookOfYear,
      ...readerOfYear,
      ...topCategories,
      ...topReviewer,
      ...mostLovedReview,
      ...trendingWishlist,
      ...bestNewcomer,
      ...feelingAward,
    ],
  };
};

export type PersistOptions = {
  overwrite?: boolean;
};

export type PersistOutcome = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  inserted?: number;
};

export const persistAwards = async (
  supabase: Client,
  result: AggregationResult,
  options: PersistOptions = {},
): Promise<PersistOutcome> => {
  const { year, summary, winners } = result;
  assertYearAllowed(year);

  const { data: existing } = await supabase
    .from("awards_years")
    .select("year, status")
    .eq("year", year)
    .maybeSingle();

  if (existing && !options.overwrite) {
    return {
      ok: true,
      skipped: true,
      reason: `Awards for ${year} already exist (status=${existing.status}).`,
    };
  }

  if (existing && options.overwrite) {
    const { error: deleteError } = await supabase
      .from("awards_winners")
      .delete()
      .eq("year", year);
    if (deleteError) throw deleteError;

    const { error: updateError } = await supabase
      .from("awards_years")
      .update({
        status: "draft",
        summary,
        published_at: null,
      })
      .eq("year", year);
    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase.from("awards_years").insert({
      year,
      status: "draft",
      summary,
    });
    if (insertError) throw insertError;
  }

  if (winners.length === 0) {
    return { ok: true, inserted: 0 };
  }

  const rows = winners.map((w) => ({
    year,
    category: w.category,
    rank: w.rank,
    winner_type: w.winnerType,
    winner_id: w.winnerId,
    snapshot: w.snapshot,
    score: w.score,
    metadata: w.metadata,
  }));

  const { error: insertWinnersError } = await supabase
    .from("awards_winners")
    .insert(rows);
  if (insertWinnersError) throw insertWinnersError;

  return { ok: true, inserted: rows.length };
};
