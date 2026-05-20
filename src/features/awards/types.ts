export type AwardCategory =
  | "book_of_the_year"
  | "reader_of_the_year"
  | "top_categories"
  | "top_reviewer"
  | "most_loved_review"
  | "trending_wishlist"
  | "best_newcomer"
  | "feeling_award";

export type AwardWinnerType =
  | "book"
  | "user"
  | "tag"
  | "review"
  | "feeling_book";

export type AwardsYearStatus = "draft" | "published" | "archived";

export type BookSnapshot = {
  type: "book";
  title: string;
  author: string;
  coverUrl: string | null;
  slug: string | null;
};

export type UserSnapshot = {
  type: "user";
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
};

export type TagSnapshot = {
  type: "tag";
  name: string;
  slug: string;
};

export type ReviewSnapshot = {
  type: "review";
  title: string | null;
  excerpt: string;
  bookTitle: string;
  bookSlug: string | null;
  bookCoverUrl: string | null;
  authorDisplayName: string;
  authorUsername: string | null;
  authorAvatarUrl: string | null;
};

export type FeelingBookSnapshot = {
  type: "feeling_book";
  feelingLabel: string;
  feelingSlug: string;
  bookTitle: string;
  bookAuthor: string;
  bookCoverUrl: string | null;
  bookSlug: string | null;
};

export type WinnerSnapshot =
  | BookSnapshot
  | UserSnapshot
  | TagSnapshot
  | ReviewSnapshot
  | FeelingBookSnapshot;

export type AwardWinner = {
  id: string;
  year: number;
  category: AwardCategory;
  rank: number;
  winnerType: AwardWinnerType;
  winnerId: string | null;
  snapshot: WinnerSnapshot;
  score: number;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AwardsYear = {
  year: number;
  status: AwardsYearStatus;
  theme: string | null;
  intro: string | null;
  summary: AwardsYearSummary;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AwardsYearSummary = {
  totalBooksFinished: number;
  totalUsersActive: number;
  totalReviewsPublished: number;
  totalFeelings: number;
  totalNewcomers: number;
};

export type AggregatedAward = {
  category: AwardCategory;
  rank: number;
  winnerType: AwardWinnerType;
  winnerId: string | null;
  snapshot: WinnerSnapshot;
  score: number;
  metadata: Record<string, unknown>;
};

export type AggregationResult = {
  year: number;
  summary: AwardsYearSummary;
  winners: AggregatedAward[];
};

export const TOP_N = 5;
export const NEWCOMER_MIN_FINISHED = 3;
export const MIN_AWARDS_YEAR = 2026;
