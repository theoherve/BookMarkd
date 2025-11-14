# BookMarkd

BookMarkd est une application Next.js 14 construite autour de TailwindCSS 4 et shadcn/ui pour offrir un “Letterboxd des livres”. Elle permet de suivre ses lectures, voir celles de ses amis, noter, commenter et recevoir des recommandations contextuelles.

## Démarrage rapide

```bash
pnpm install
pnpm run dev
```

Ensuite, rendez-vous sur [http://localhost:3000](http://localhost:3000) pour explorer le feed social de démonstration.

## Documentation

- `docs/README.md` – vision produit & roadmap
- `docs/ARCHITECTURE.md` – architecture applicative & choix techniques
- `docs/COMPONENTS.md` – catalogue des composants UI
- `docs/PAGES.md` – plan des routes Next.js
- `docs/API.md` – design des endpoints
- `docs/DB_SCHEMA.md` – schéma de base de données
- `docs/task-list/TASKS.md` – suivi opérationnel des chantiers
- `supabase/schema.sql` – création du schéma Postgres (tables + RLS)
- `supabase/seed.sql` – données de démonstration (utilisateur test)
- `docs/task-list/TASKS.md` – suivi opérationnel des chantiers

## Stack

- Next.js 16 (App Router, Server Components, Server Actions)
- TypeScript strict
- TailwindCSS 4 + shadcn/ui
- Zustand & TanStack Query (mise en place planifiée)
- Supabase / PostgreSQL + Drizzle (à intégrer)
- NextAuth (auth email + OAuth futur), Stripe (abonnement) en option

## Authentification

- Page de connexion : `/login` (provider Credentials NextAuth).
- Identifiants démo : `camille@example.com` / `bookmarkd123`.
- Variables d’environnement requises :

```bash
NEXTAUTH_SECRET="openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
SUPABASE_URL="https://<your-project>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="..."
NEXT_PUBLIC_SUPABASE_URL="https://<your-project>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

- Lancer `supabase/schema.sql` dans l’éditeur SQL Supabase pour créer les tables + policies de base.
- Exécuter `supabase/seed.sql` pour créer le compte démo (mot de passe hashé).
- RLS : prévoir des policies adaptées (ex. accès lecture publique sur les livres, restrictions par user_id).

## Scripts utiles

```bash
pnpm run dev     # serveur de développement
pnpm run lint    # linting ESLint
pnpm run build   # build de production
pnpm run start   # serveur Next.js en mode production
```

Prochaines étapes : mettre en place l’authentification, connecter la base de données décrite dans `docs/DB_SCHEMA.md` et brancher les données réelles sur le feed.
