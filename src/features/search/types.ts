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
  source: "supabase" | "open_library";
  reason?: string | null;
};

export type SearchResponse = {
  books: SearchBook[];
  supabaseCount: number;
  externalCount: number;
};

export type SearchUser = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  stats: {
    followers: number;
    booksRead: number;
  };
};

export type UserSearchResponse = {
  users: SearchUser[];
  count: number;
};

