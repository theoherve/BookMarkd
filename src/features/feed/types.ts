export type FeedActivity = {
  id: string;
  type: "rating" | "review" | "status_change" | "list_update" | "follow";
  userName: string;
  userAvatarUrl?: string | null;
  bookId?: string | null;
  bookTitle?: string | null;
  bookAuthor?: string | null;
  note?: string | null;
  rating?: number | null;
  occurredAt: string;
  /** Phrase condensée quand plusieurs activités du même utilisateur sur le même livre sont fusionnées (ex: "a terminé et a mis 5/5") */
  combinedAction?: string | null;
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

export type BookReaderPreview = {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  status: "to_read" | "reading" | "finished";
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
  /** Libellé personnalisé pour le badge score (ex: "12 lecteurs", "Note : 4.5/5"). Si absent, affiche "Affinité estimée : X%". Si vide, masque le badge. */
  scoreLabel?: string;
  friendNames?: string[];
  friendCount?: number;
  viewerHasInReadlist?: boolean;
  friendHighlights?: string[];
  tags?: string[];
  readers?: BookReaderPreview[];
};

export type FeedResponse = {
  activities: FeedActivity[];
  friendsBooks: FeedFriendBook[];
  recommendations: FeedRecommendation[];
  /** Présent quand la pagination des activités est utilisée (query params) */
  hasMoreActivities?: boolean;
  /** Indique si les activités affichées viennent des amis ou de la communauté entière */
  activitiesSource?: "friends" | "community";
  /** Livres les plus lus sur la plateforme (rempli quand l'utilisateur n'a pas d'amis) */
  trendingBooks?: FeedRecommendation[];
  /** Livres les mieux notés (rempli quand pas de recommandations personnalisées) */
  topRatedBooks?: FeedRecommendation[];
  /** Livres récemment ajoutés (rempli quand pas d'amis) */
  recentBooks?: FeedRecommendation[];
};

