# Task List BookMarkd

## Vue d’ensemble

- **Dernière mise à jour** : 13/11/2025
- **Responsable** : Team Front (piloté par agent GPT-5 Codex)

## Statut courant

- [x] Initialiser le repo Next.js 14 avec pnpm (`create-next-app`).
- [x] Configurer TailwindCSS 4 + palette BookMarkd.
- [x] Installer et intégrer shadcn/ui (composants de base).
- [x] Mettre en place l’authentification NextAuth (email/password).
- [x] Connecter la base PostgreSQL/Supabase (structure complète + lecture/écriture).
- [x] Implémenter le feed social avec données réelles.
- [x] Implémenter la recherche avancée + intégration Open Library.
- [x] Créer les vues Listes personnalisées.
- [x] Ajouter les tests (Vitest, Playwright) et workflows CI.

## Notes rapides

- Palette café librairie appliquée dans `src/app/globals.css`.
- Authentification Credentials NextAuth fonctionnelle (`/login`, session provider global) branchée sur Supabase (users table).
- Composants shadcn/ui opérationnels (Button, Card, Badge, Skeleton déjà intégrés au feed).
- Supabase : scripts `supabase/schema.sql` (tables + policies) et `supabase/seed.sql` (utilisateur démo + activités).
- Feed branché sur `/api/feed` (TanStack Query + Zustand pour les filtres) + recommandations enrichies (amis, tags, actions).
- Recherche `/search` : filters (genre, Open Library) + fallback Open Library opérationnels.
- Schéma étendu : `list_collaborators`, `review_comments` + policies RLS associées.
- Page `/books/[bookId]` : statut lecture, notation, avis & commentaires (Server Actions).
- Vues `/lists`, `/lists/create`, `/lists/[listId]` : création, gestion et collaboration sur les listes (Server Actions, Supabase).
- Navigation renforcée : `/feed`, accueil avec raccourcis, `/profiles/me` (dashboard utilisateur).
- Import Open Library : CTA d’import vers Supabase depuis la recherche (tags auto).
- Base tests/CI : Vitest + Playwright + GitHub Actions (lint / test). Les tests e2e se déclenchent quand les variables Supabase sont renseignées.
- Auth credentials complète (signup + login) via Server Actions.
- Doc migration Google Books : voir `docs/GOOGLE_BOOKS_MIGRATION.md`.
- Prochaine grosse étape : vues Listes collaboratives (UI/UX), features sociales avancées, automatisation import externe.

> Maintenir cette liste à chaque session : cocher les tâches terminées, ajouter les nouvelles issues ou sous-tâches au fil du développement.
