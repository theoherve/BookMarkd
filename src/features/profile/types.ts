export type ReadingStats = {
  toRead: number;
  reading: number;
  finished: number;
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
};

