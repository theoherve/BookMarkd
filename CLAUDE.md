# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Next.js 16 (App Router, Server Components, Server Actions, React Compiler enabled) · React 19 · TypeScript strict · TailwindCSS 4 + shadcn/ui (Radix) · TanStack Query 5 (server data) + Zustand 5 (UI) · NextAuth 4 (JWT, Credentials provider, bcrypt) · Supabase Postgres + Storage (RLS on every table) · next-pwa + Workbox + IndexedDB · Vitest (unit) + Playwright (E2E) + Lighthouse · pnpm 10.

## Commands

```bash
pnpm dev              # next dev — Turbopack DISABLED (TURBOPACK=0), uses Webpack
pnpm build            # next build --webpack (Webpack, not Turbopack)
pnpm lint             # eslint
pnpm test             # vitest run (unit, node env, excludes tests/e2e/**)
pnpm test:watch
pnpm test:coverage    # v8 → ./coverage
pnpm test:ui          # playwright (tests/e2e/**, needs SUPABASE_URL set)
pnpm test:pwa         # playwright tests/e2e/pwa-*.spec.ts
pnpm playwright:install
```

Single Vitest file: `pnpm vitest run tests/isbn.test.ts`. Single test name: `pnpm vitest run -t "name"`.

Utility scripts (tsx): `pnpm db:reset`, `pnpm db:test`, `pnpm covers:backfill`, `pnpm covers:find-missing`, `pnpm icons:pwa`, `pnpm lighthouse:pwa`.

`@/*` alias = `src/*` (vitest + tsconfig).

## Required env

```
NEXTAUTH_SECRET=...                  # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
SUPABASE_URL=...                     # service-side client
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...         # browser client
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Demo creds (seed): `camille@example.com` / `bookmarkd123`. Bootstrap: run `supabase/schema.sql` then `supabase/seed.sql` in Supabase SQL editor. Migrations are individual `supabase/migration-*.sql` files applied manually in order.

## Architecture

Detailed maps live in `docs/ARCHITECTURE.md` (routes, API, Server Actions, DB schema). Key invariants:

- **Mutations = Server Actions**, not API routes. `src/server/actions/*` is the mutation surface (`book`, `review`, `lists`, `follow`, `profile`, `auth`, `feedback`, `notifications`, `recommend`, `discover`, `readlist`, imports, `admin/*`). API routes under `src/app/api/*` are for reads, third-party callbacks, uploads, cron, PWA sync, NextAuth.
- **`src/features/<domain>/`** = domain modules (server functions + React Query hooks + types). **`src/lib/`** = cross-cutting infra (auth, supabase clients, google-books/open-library/nytimes adapters, isbn, slug, storage, pwa, email, analytics). **`src/components/`** = presentational; shadcn primitives in `components/ui/`.
- **Two Supabase clients** in `src/lib/supabase/`: `db.ts` (anon, browser/RLS-respecting) vs `service-client.ts` (service role, server-only — never import into client components).
- **Auth**: NextAuth Credentials only, JWT strategy, `isAdmin` baked into the token. Users stored in Supabase Postgres (NOT Supabase Auth). `src/middleware.ts` gates `/admin/:path*` and redirects non-admins to `/`.
- **Data fetching**: TanStack Query for client reads; Server Components for initial render; Server Actions return revalidated data and invalidate query caches client-side.
- **PWA**: `next-pwa` disabled in dev. SW registration is manual via provider (not auto). Offline mutations queue to IndexedDB (`src/lib/pwa/`) and replay via `/api/pwa/offline-actions`. `/offline` is the document fallback.
- **External book sources**: Google Books (quota-tracked via `google_books_quota` table + `src/lib/google-books/`), Open Library, NY Times bestsellers (cron-fed staging table `nytimes_weekly_rankings`). Lookups in `/api/books/search` and `/api/books/isbn/[isbn]` fan out across all three.
- **Build uses Webpack, not Turbopack** — `dev` and `build` scripts force this. React Compiler is enabled (`reactCompiler: true`).

## Design system (CRITIQUE)

**Avant tout travail UI**, lire `docs/design-system.md`. Charte stricte pour tout composant — manuel ou généré par un skill (`/ui-ux-pro-max`, `frontend-design`, `figma-implement-design`, etc.).

### Règle d'or polices

**100% Geist Sans.** Body, titres, hero, nav, boutons, formulaires — tout. Page `src/app/page.tsx` = référence visuelle absolue.

Deux polices uniquement, chargées dans `src/app/layout.tsx` :
- `font-sans` (Geist) — défaut hérité du `<body>`, **ne pas surcharger**
- `font-mono` (Geist Mono) — micro-labels uppercase tracking-wide, ISBN, codes

### Interdits absolus

- `font-display` — **token retiré**. Si trouvé dans le code → supprimer la classe + supprimer `italic` qui l'accompagne
- `font-serif` Tailwind (= Georgia système)
- `font-family` inline / `style={{ fontFamily }}`
- Toute Google Font tierce (Inter, Roboto, Poppins, Manrope, Lora, Playfair, Fraunces, etc.)
- `italic` sur les titres (résidu de l'ancien `font-display`)
- Couleurs hex en dur — utiliser tokens (`bg-background`, `text-foreground`, `bg-accent`, etc.)
- Composant sans variante dark traitée

### Référence visuelle

Page d'index `src/app/page.tsx` = source de vérité. Tout panel, menu ou nouveau composant doit avoir la même esthétique.

### Quand un skill génère du code

1. `grep` pour `font-display`, `font-serif`, `font-family`, Google Fonts tierces → corriger
2. Retirer tout `italic` sur les titres
3. Valider la checklist en fin de `docs/design-system.md`
4. Comparer visuellement avec `src/app/page.tsx`
