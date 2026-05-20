import type { AwardCategory } from "@/features/awards/types";

export const CATEGORY_LABELS: Record<
  AwardCategory,
  { title: string; subtitle: string; kicker: string }
> = {
  book_of_the_year: {
    title: "Livre de l’année",
    subtitle:
      "Le titre qui a marqué la communauté — note moyenne pondérée par le volume de lecteurs.",
    kicker: "Trophée principal",
  },
  reader_of_the_year: {
    title: "Lecteur de l’année",
    subtitle:
      "Celui ou celle qui a le plus dévoré, écrit et partagé sur l’app.",
    kicker: "Marathon de lecture",
  },
  top_categories: {
    title: "Catégories phares",
    subtitle: "Les genres qui ont fait vibrer la communauté cette année.",
    kicker: "Tendances de fond",
  },
  top_reviewer: {
    title: "Critique de l’année",
    subtitle: "Reviews publiées + likes reçus = la voix qui compte.",
    kicker: "Plume aiguisée",
  },
  most_loved_review: {
    title: "Critique la plus aimée",
    subtitle: "La review qui a fait l’unanimité sur BookMarkd.",
    kicker: "Coup de cœur communautaire",
  },
  trending_wishlist: {
    title: "Livre le plus convoité",
    subtitle: "Le plus ajouté en wishlist via /discover.",
    kicker: "Sur toutes les piles à lire",
  },
  best_newcomer: {
    title: "Révélation de l’année",
    subtitle:
      "Le compte créé cette année qui s’est imposé le plus vite (min. 3 livres finis).",
    kicker: "Nouveau venu",
  },
  feeling_award: {
    title: "Sentiment de l’année",
    subtitle:
      "Le duo livre + ressenti dominant qui a le plus rassemblé la communauté.",
    kicker: "Émotion collective",
  },
};
