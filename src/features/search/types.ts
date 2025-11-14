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

