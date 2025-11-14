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
- [ ] Implémenter le feed social avec données réelles.
- [ ] Implémenter la recherche avancée + intégration Open Library.
- [ ] Créer les vues Listes personnalisées.
- [ ] Ajouter les tests (Vitest, Playwright) et workflows CI.

## Notes rapides

- Palette café librairie appliquée dans `src/app/globals.css`.
- Authentification Credentials NextAuth fonctionnelle (`/login`, session provider global) branchée sur Supabase (users table).
- Composants shadcn/ui opérationnels (Button, Card, Badge, Skeleton déjà intégrés au feed).
- Supabase : scripts `supabase/schema.sql` (tables + policies) et `supabase/seed.sql` (utilisateur démo).
- Prochaine grosse étape : complétion du schéma Supabase (tables livres, listes…) + state management (Zustand + TanStack Query).

> Maintenir cette liste à chaque session : cocher les tâches terminées, ajouter les nouvelles issues ou sous-tâches au fil du développement.
