export type SearchBook = {
  id: string;
  title: string;
  author: string;
  coverUrl?: string | null;
  summary?: string | null;
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  averageRating?: number | null;
  publicationYear?: number | null;
  source: "supabase" | "open_library" | "google_books";
  reason?: string | null;
};

export type SearchResponse = {
  books: SearchBook[];
  supabaseCount: number;
  externalCount: number;
};

export type SearchUser = {
  id: string;
  username?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  stats: {
    followers: number;
    booksRead: number;
  };
  followStatus?: "following" | "request_pending" | "request_rejected" | "not_following";
};

export type UserSearchResponse = {
  users: SearchUser[];
  count: number;
};

