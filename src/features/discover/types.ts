export type DiscoverMatchReason =
  | { kind: "tag"; label: string }
  | { kind: "author"; label: string }
  | { kind: "popular"; label: string }
  | { kind: "friends"; label: string };

export type DiscoverCandidate = {
  id: string;
  slug: string | null;
  title: string;
  author: string;
  coverUrl: string | null;
  summary: string | null;
  publicationYear: number | null;
  averageRating: number | null;
  ratingsCount: number;
  tags: Array<{ id: string; name: string }>;
  compatibilityScore: number;
  matchReasons: DiscoverMatchReason[];
  friendsCount: number;
  friendsAvgRating: number | null;
};

export type DiscoverWishlistEntry = {
  bookId: string;
  slug: string | null;
  title: string;
  author: string;
  coverUrl: string | null;
  addedAt: string;
};
