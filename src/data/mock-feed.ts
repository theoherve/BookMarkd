export type ActivityItem = {
  id: string;
  userName: string;
  action: "rated" | "commented" | "finished";
  bookTitle: string;
  rating?: number;
  note?: string;
  occurredAt: string;
};

export type BookFeedItem = {
  id: string;
  title: string;
  author: string;
  averageRating: number;
  readers: string[];
  highlight: string;
};

export type RecommendationItem = {
  id: string;
  title: string;
  author: string;
  reason: string;
  matchScore: number;
};

export const activityFeed: ActivityItem[] = [
  {
    id: "activity-1",
    userName: "Camille B.",
    action: "rated",
    bookTitle: "Le Château ambulant",
    rating: 5,
    note: "Un univers onirique parfait pour l’automne.",
    occurredAt: "Il y a 2 h",
  },
  {
    id: "activity-2",
    userName: "Hugo L.",
    action: "commented",
    bookTitle: "Les Furtifs",
    note: "Un manifeste politique déguisé en SF coup de poing.",
    occurredAt: "Il y a 5 h",
  },
  {
    id: "activity-3",
    userName: "Anaïs P.",
    action: "finished",
    bookTitle: "Tomorrow, and Tomorrow, and Tomorrow",
    occurredAt: "Hier",
  },
];

export const bookHighlights: BookFeedItem[] = [
  {
    id: "book-1",
    title: "Le Nom du vent",
    author: "Patrick Rothfuss",
    averageRating: 4.6,
    readers: ["Camille", "Erwan", "Nina"],
    highlight: "Ajouté dans 12 listes fantasy cette semaine.",
  },
  {
    id: "book-2",
    title: "Pachinko",
    author: "Min Jin Lee",
    averageRating: 4.4,
    readers: ["Hugo", "Milo"],
    highlight: "Vos amis ont passé 34h à le lire ce mois-ci.",
  },
];

export const personalRecommendations: RecommendationItem[] = [
  {
    id: "rec-1",
    title: "Mexican Gothic",
    author: "Silvia Moreno-Garcia",
    reason: "Parce que vous avez adoré l’atmosphère de « Rebecca ».",
    matchScore: 92,
  },
  {
    id: "rec-2",
    title: "Daisy Jones & The Six",
    author: "Taylor Jenkins Reid",
    reason: "Populaire parmi vos amis musiciens.",
    matchScore: 88,
  },
  {
    id: "rec-3",
    title: "La Mer sans étoiles",
    author: "Erin Morgenstern",
    reason: "Univers magique recommandé après « Le Cirque des rêves ».",
    matchScore: 84,
  },
];

