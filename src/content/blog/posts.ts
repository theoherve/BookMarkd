export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt?: Date;
  image?: string;
  body: string;
};

const posts: BlogPost[] = [
  {
    slug: "top-10-livres-2024-communaute-bookmarkd",
    title: "Top 10 livres 2024 par la communauté BookMarkd",
    description:
      "Découvrez les livres les plus notés et les plus lus en 2024 par les utilisateurs de BookMarkd.",
    publishedAt: new Date("2024-12-15"),
    updatedAt: new Date("2024-12-15"),
    body: `La communauté BookMarkd a parlé : voici une sélection des livres qui ont marqué l'année 2024 selon les notes et les lectures partagées sur la plateforme.

Que vous cherchiez votre prochaine lecture ou que vous souhaitiez comparer vos goûts avec ceux des autres lecteurs et lectrices, ces titres sont un bon point de départ.

Pour découvrir plus de livres et rejoindre la communauté, [recherchez sur BookMarkd](/search) ou [créez un compte](https://bookmarkd.app/signup) pour noter et partager vos propres coups de cœur.`,
  },
  {
    slug: "comment-organiser-sa-pal-avec-des-listes",
    title: "Comment organiser sa PAL avec des listes",
    description:
      "Guide pratique pour structurer votre pile à lire avec les listes BookMarkd : à lire, en cours, coups de cœur et listes collaboratives.",
    publishedAt: new Date("2025-01-10"),
    body: `Une pile à lire (PAL) qui déborde, c’est le lot de beaucoup d’entre nous. Les listes sur BookMarkd permettent d’y voir plus clair et de partager vos sélections.

**Listes personnelles** : créez des listes « À lire », « En cours », « Coups de cœur » ou thématiques (polar, SF, etc.). Chaque livre peut être déplacé d’une liste à l’autre au fil de vos lectures.

**Listes collaboratives** : invitez des ami·e·s ou votre club de lecture à éditer une liste commune. Idéal pour préparer une sélection à plusieurs ou suivre les recommandations du groupe.

[Découvrir les listes sur BookMarkd](/lists) · [Rechercher un livre](/search)`,
  },
  {
    slug: "pourquoi-tenir-un-journal-lecture-en-2025",
    title: "Pourquoi tenir un journal de lecture en 2025",
    description:
      "Les bénéfices du suivi de lecture : mémorisation, recommandations et communauté. Comment BookMarkd vous aide à garder la trace de vos lectures.",
    publishedAt: new Date("2025-01-20"),
    body: `Tenir un journal de lecture, c’est bien plus qu’une liste de titres : ça aide à fixer ce qu’on a aimé (ou pas), à se souvenir des personnages et des idées, et à partager des avis avec d’autres lecteurs et lectrices.

Avec BookMarkd, vous pouvez noter vos livres, écrire des avis, suivre votre statut (à lire, en cours, terminé) et voir les recommandations de votre réseau. Les statistiques personnelles et le fil d’actualité transforment la lecture en une pratique plus sociale et mieux structurée.

[Rejoindre BookMarkd](https://bookmarkd.app/signup) · [En savoir plus sur l’app](https://bookmarkd.app)`,
  },
];

export const getAllPosts = (): BlogPost[] =>
  [...posts].sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
  );

export const getPostBySlug = (slug: string): BlogPost | undefined =>
  posts.find((p) => p.slug === slug);
