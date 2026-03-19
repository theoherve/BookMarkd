export type EditorialListType = "bestseller" | "award" | "selection" | "new_releases";
export type EditorialListSource = "nytimes" | "manual";
export type EditorialListStatus = "draft" | "published" | "archived";
export type EditorialPeriodType = "weekly" | "semester";

export type EditorialListBook = {
  id: string;
  listId: string;
  // Local book link (may be null)
  bookId: string | null;
  bookSlug: string | null;
  // External data (always present, from NY Times or manual)
  externalTitle: string | null;
  externalAuthor: string | null;
  externalIsbn: string | null;
  externalCoverUrl: string | null;
  // NY Times metadata (weekly)
  nytimesRank: number | null;
  nytimesDescription: string | null;
  // Semester aggregation stats
  appearances: number | null;
  avgRank: number | null;
  bestRank: number | null;
  aggregateScore: number | null;
  position: number;
  createdAt: string;
};

export type EditorialList = {
  id: string;
  title: string;
  description: string | null;
  type: EditorialListType;
  source: EditorialListSource;
  status: EditorialListStatus;
  nytimesListName: string | null;
  weekDate: string | null;
  // Semester fields
  periodType: EditorialPeriodType | null;
  semesterLabel: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  displayOrder: number;
  badgeLabel: string | null;
  expiresAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  books?: EditorialListBook[];
};

// Admin views
export type AdminEditorialList = EditorialList & {
  bookCount: number;
};

// Home page view (published only, with books)
export type PublishedEditorialList = EditorialList & {
  books: EditorialListBook[];
};

// NY Times API types
export type NytimesBook = {
  rank: number;
  title: string;
  author: string;
  description: string;
  primary_isbn13: string;
  book_image: string;
};

export type NytimesListResult = {
  list_name: string;
  list_name_encoded: string;
  bestsellers_date: string;
  published_date: string;
  books: NytimesBook[];
};
