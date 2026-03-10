// ============================================================================
// Types admin pour la console d'administration BookMarkd
// ============================================================================

// -- Pagination & filtres generiques --

export type AdminPaginationParams = {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type DateRange = {
  from: Date;
  to: Date;
};

export type ChartDataPoint = {
  date: string;
  value: number;
  label?: string;
};

export type ExportFormat = "csv" | "json";

// -- Dashboard --

export type DashboardStats = {
  totalUsers: number;
  totalBooks: number;
  totalReviews: number;
  totalLists: number;
  activeUsers30d: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  pendingFeedbacks: number;
};

// -- Users --

export type AdminUserReview = {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCoverUrl: string | null;
};

export type AdminUser = {
  id: string;
  email: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isAdmin: boolean;
  disabledAt: string | null;
  createdAt: string;
  updatedAt: string;
  booksCount: number;
  reviewsCount: number;
  listsCount: number;
  reviews: AdminUserReview[];
};

export type AdminUserDetail = AdminUser & {
  followersCount: number;
  followingCount: number;
  recentActivity: AdminActivity[];
  readingStats: {
    toRead: number;
    reading: number;
    finished: number;
  };
};

export type AdminActivity = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

// -- Books --

export type AdminBook = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  publicationYear: number | null;
  averageRating: number;
  ratingsCount: number;
  reviewsCount: number;
  readersCount: number;
  createdAt: string;
};

export type AdminBookDetail = AdminBook & {
  summary: string | null;
  isbn: string | null;
  publisher: string | null;
  language: string | null;
  openLibraryId: string | null;
  googleBooksId: string | null;
  tags: { id: string; name: string; slug: string }[];
  ratingDistribution: { rating: number; count: number }[];
  viewsCount: number;
};

// -- Feedback --

export type AdminFeedbackFilters = {
  status?: string;
  type?: string;
  search?: string;
};

// -- Tags & Feelings --

export type AdminBookRef = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
};

export type AdminTag = {
  id: string;
  name: string;
  slug: string;
  booksCount: number;
  books: AdminBookRef[];
  createdAt: string;
};

export type AdminFeeling = {
  id: string;
  label: string;
  slug: string;
  source: "admin" | "user";
  usageCount: number;
  books: AdminBookRef[];
  createdBy: string | null;
  createdAt: string;
};

// -- Blog --

export type AdminBlogPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  imageUrl: string | null;
  status: "draft" | "published" | "archived";
  authorId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  viewsCount?: number;
};

// -- Email --

export type AdminEmailLog = {
  id: string;
  emailType: string;
  recipientEmail: string;
  subject: string;
  status: "sent" | "failed" | "bounced";
  resendId: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

// -- System Health --

export type SystemHealthStatus = "healthy" | "warning" | "error";

export type SystemHealthCheck = {
  service: string;
  status: SystemHealthStatus;
  message: string;
  latency?: number;
  lastChecked: string;
};
