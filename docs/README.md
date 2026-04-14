# BookMarkd — Documentation

BookMarkd est une application web de gestion de bibliothèque personnelle et de découverte littéraire. Feed social, avis, listes, scan ISBN, tendances éditoriales.

## Stack

Next.js 16 (App Router) · TypeScript · TailwindCSS 4 · shadcn/ui · Supabase (PostgreSQL + Storage) · NextAuth · Vercel

## Fonctionnalités

- Bibliothèque personnelle (À lire / En cours / Lu) avec notation
- Avis et commentaires (visibilité public/amis/privé)
- Listes personnalisées et collaboratives
- Feed social (activités des suivis)
- Recherche multi-sources (Google Books, Open Library, base locale)
- Scan code-barres ISBN (mobile)
- Tendances éditoriales (NY Times bestsellers, listes curées)
- Blog intégré
- Wrapped — année en revue
- Feeling keywords (badges émotionnels sur livres)
- PWA avec support offline (IndexedDB queue + sync)
- Panneau admin complet (analytics, gestion users/books/blog/tags)

## Getting Started

```bash
pnpm install
pnpm run dev
```

Créer `.env.local` avec les variables Supabase, NextAuth, Google Books API (voir `ARCHITECTURE.md`).

## Documentation

| Fichier | Contenu |
|---------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Stack, structure, routes, API, schéma DB, composants |
| [GOOGLE_BOOKS_SETUP.md](GOOGLE_BOOKS_SETUP.md) | Configuration API Google Books |
| [FEELING_KEYWORDS.md](FEELING_KEYWORDS.md) | Feature feeling keywords |
| [FAQ_INSTALLATION.md](FAQ_INSTALLATION.md) | Guide installation PWA |
| [PWA_OFFLINE_QUEUE.md](PWA_OFFLINE_QUEUE.md) | Système offline queue |
| [PWA_TESTING_GUIDE.md](PWA_TESTING_GUIDE.md) | Guide test PWA |
| [PWA_TEST_CHECKLIST.md](PWA_TEST_CHECKLIST.md) | Checklist QA PWA |
| [PWA_CI_CD.md](PWA_CI_CD.md) | Intégration CI/CD PWA |
