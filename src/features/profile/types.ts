export type ReadingStats = {
  toRead: number;
  reading: number;
  finished: number;
};

export type TopBook = {
  id: string;
  bookId: string;
  position: number;
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
  };
};

export type RecentActivity = {
  id: string;
  type:
    | "rating"
    | "review"
    | "status_change"
    | "readlist_add"
    | "review_comment"
    | "list_create"
    | "list_item_add"
    | "review_like"
    | "follow"
    | "top_book_update";
  bookTitle: string | null;
  bookId: string | null;
  bookSlug: string | null;
  listTitle: string | null;
  note: string | null;
  rating: number | null;
  status: "to_read" | "reading" | "finished" | null;
  occurredAt: string;
};

export type ReadListBook = {
  id: string;
  bookId: string;
  status: "to_read" | "reading" | "finished";
  rating: number | null;
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
  };
  updatedAt: string;
};

export type ProfileDashboard = {
  displayName: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  ownedLists: number;
  collaborativeLists: number;
  recommendationsCount: number;
  readingStats: ReadingStats;
  topBooks: TopBook[];
  recentActivities: RecentActivity[];
  readList: ReadListBook[];
};

