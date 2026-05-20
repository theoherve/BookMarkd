export type BookCandidate = {
  bookId: string;
  finishCount: number;
  avgRating: number;
  ratingCount: number;
  earliestFinishedAt: string;
};

export type ReaderCandidate = {
  userId: string;
  finishCount: number;
  reviewsWritten: number;
  listsCreated: number;
  earliestFinishedAt: string;
};

export type ReviewerCandidate = {
  userId: string;
  reviewCount: number;
  likesReceived: number;
  earliestReviewAt: string;
};

export type NewcomerCandidate = {
  userId: string;
  joinedAt: string;
  finishCount: number;
  reviewsWritten: number;
};

export const scoreBookOfTheYear = (c: BookCandidate): number => {
  if (c.finishCount <= 0) return 0;
  return (
    c.avgRating *
    Math.sqrt(c.finishCount) *
    Math.log10(c.ratingCount + 2)
  );
};

export const scoreReaderOfTheYear = (c: ReaderCandidate): number =>
  c.finishCount + 0.5 * c.reviewsWritten + 0.3 * c.listsCreated;

export const scoreTopReviewer = (c: ReviewerCandidate): number =>
  c.likesReceived + 2 * c.reviewCount;

export const scoreBestNewcomer = (c: NewcomerCandidate): number =>
  c.finishCount + 0.3 * c.reviewsWritten;

export const compareByScoreThenCreatedAt = (
  a: { score: number; createdAt: string },
  b: { score: number; createdAt: string },
): number => {
  if (b.score !== a.score) return b.score - a.score;
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
};

export const round = (value: number, decimals = 4): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};
