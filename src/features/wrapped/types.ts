export type WrappedBook = {
  id: string;
  title: string;
  author: string;
  rating: number;
  coverUrl: string | null;
};

export type WrappedCategory = {
  name: string;
  count: number;
  percentage: number;
};

export type WrappedFeeling = {
  keyword: string;
  count: number;
};

export type WrappedMonthlyBreakdown = {
  month: number;
  count: number;
};

export type WrappedStats = {
  year: number;
  totalBooksRead: number;
  averageRating: number;
  favoriteCategory: WrappedCategory | null;
  topBooks: WrappedBook[];
  worstBook: WrappedBook | null;
  favoriteAuthor: { name: string; count: number } | null;
  mostProductiveMonth: { month: number; count: number } | null;
  topCategories: WrappedCategory[];
  dominantFeelings: WrappedFeeling[];
  reviewsWritten: number;
  listsCreated: number;
  monthlyBreakdown: WrappedMonthlyBreakdown[];
};
