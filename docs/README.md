# BookMarkd – Letterboxd des livres

BookMarkd est une application web Next.js qui permet aux lectrices et lecteurs de suivre leurs lectures, partager leurs avis et découvrir de nouveaux ouvrages via un feed social riche et des recommandations personnalisées.

## Fonctionnalités clés

- Feed social temps réel (activités d’amis, lectures, recommandations).
- Fiches livres complètes (métadonnées, notes, commentaires, listes de lecteurs).
- Gestion des états de lecture (À lire, En cours, Lu) et notation sur 5 étoiles.
- Listes personnalisées et partageables (ex. “Top fantasy”, “Cadeaux”).
- Recherche avancée avec filtres (genre, auteur, note, état).
- Authentification email/mot de passe (OAuth en option).
- Intégration d’une API externe (Open Library) pour enrichir le catalogue.

## Stack technique

- Next.js 14+ (App Router, Server Actions, RSC).
- TypeScript strict.
- TailwindCSS 4 + shadcn/ui (Radix UI).
- Gestion d’état client : Zustand + TanStack Query.
- Authentification : NextAuth (adapter OAuth futur).
- Base de données : PostgreSQL (SQLite pour le dev local).
- ORM : Drizzle (ou Prisma, cf. `ARCHITECTURE.md`).
- Déploiement cible : Vercel + Supabase (Postgres, Auth, Storage).

## Auth & inscription

- Connexion : `/login` (credentials démo `camille@example.com` / `bookmarkd123`).
- Inscription : `/signup` (Server Action `registerUser`, validation email/mot de passe).
- Voir `docs/API.md` & `docs/GOOGLE_BOOKS_MIGRATION.md` pour les évolutions prévues.

## Getting Started

```bash
pnpm install
pnpm run dev
```

- Créer un fichier `.env.local` (voir `ARCHITECTURE.md`).
- Lancer la base locale : `pnpm db:push` (Drizzle) ou `pnpm prisma db push`.

## Roadmap initiale

1. Setup Next.js, TailwindCSS 4, shadcn/ui.
2. Auth email/mot de passe (NextAuth) + profils utilisateurs.
3. Modèle de données livres + états + commentaires.
4. Feed social + suivi d’amis.
5. Recherche avancée + intégration Open Library.
6. Listes personnalisées + recommandations.
7. Notifications & gamification (succès, badges) – phase ultérieure.

Pour plus de détails, consulter `ARCHITECTURE.md`, `API.md`, `DB_SCHEMA.md`.


