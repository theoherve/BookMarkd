export type FeedActivity = {
  id: string;
  type: "rating" | "review" | "status_change" | "list_update" | "follow";
  userName: string;
  userAvatarUrl?: string | null;
  bookTitle?: string | null;
  note?: string | null;
  rating?: number | null;
  occurredAt: string;
};

export type FeedFriendBook = {
  id: string;
  bookId: string;
  title: string;
  author: string;
  coverUrl?: string | null;
  averageRating?: number | null;
  status: "to_read" | "reading" | "finished";
  updatedAt: string;
  readerName: string;
  readerAvatarUrl?: string | null;
};

export type FeedRecommendation = {
  id: string;
  bookId: string;
  title: string;
  author: string;
  coverUrl?: string | null;
  reason?: string | null;
  source: "friends" | "global" | "similar";
  score: number;
  friendNames?: string[];
  friendCount?: number;
  viewerHasInReadlist?: boolean;
  friendHighlights?: string[];
  tags?: string[];
};

export type FeedResponse = {
  activities: FeedActivity[];
  friendsBooks: FeedFriendBook[];
  recommendations: FeedRecommendation[];
};

