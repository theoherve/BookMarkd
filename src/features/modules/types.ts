export type SiteModuleKey =
  | "home_feed_preview"
  | "home_editorial"
  | "home_public_lists"
  | "home_blog_preview";

export type SiteModule = {
  key: SiteModuleKey;
  label: string;
  description: string | null;
  enabled: boolean;
  updatedAt: string;
};

export const KNOWN_MODULE_KEYS: readonly SiteModuleKey[] = [
  "home_feed_preview",
  "home_editorial",
  "home_public_lists",
  "home_blog_preview",
] as const;

export const MODULE_DEFAULTS: Record<SiteModuleKey, { label: string; description: string }> = {
  home_feed_preview: {
    label: "Aperçu du fil",
    description:
      "Section « Aperçu du fil » sur la page d'accueil (activités, recommandations, tendances).",
  },
  home_editorial: {
    label: "Tendances & Actu littéraire",
    description:
      "Section « Tendances & Actu littéraire » (sélections éditoriales) sur la page d'accueil.",
  },
  home_public_lists: {
    label: "Listes de la communauté",
    description: "Section « Listes de la communauté » sur la page d'accueil.",
  },
  home_blog_preview: {
    label: "Derniers articles du blog",
    description: "Section « Derniers articles du blog » sur la page d'accueil.",
  },
};
