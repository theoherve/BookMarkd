# BookMarkd — Architecture & Référence technique

## Stack technique

| Catégorie | Technologie |
|-----------|-------------|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Langage | TypeScript 5 (strict) |
| UI | TailwindCSS 4, shadcn/ui (Radix UI), Lucide React |
| État client | TanStack Query 5 (données async), Zustand 5 (UI locale) |
| Auth | NextAuth 4 (JWT, CredentialsProvider email/password) |
| Base de données | PostgreSQL via Supabase (RLS activé) |
| Stockage fichiers | Supabase Storage (covers, avatars) |
| APIs externes | Google Books, Open Library, NY Times Bestsellers |
| Email | Resend |
| PWA | next-pwa, Workbox, IndexedDB (idb) |
| Scan ISBN | html5-qrcode (EAN-13) |
| Charts | Recharts |
| Drag & drop | @dnd-kit |
| Tests | Vitest (unit), Playwright (E2E), Lighthouse (perf) |
| Déploiement | Vercel |
| Package manager | pnpm |

---

## Structure des dossiers

```
src/
  app/
    (auth)/              ← login, signup
    (app)/               ← pages principales (feed, search, etc.)
    admin/               ← panneau admin
    blog/                ← blog public
    api/                 ← routes API
  components/
    ui/                  ← shadcn/Radix primitives (21)
    books/               ← cartes, covers, détails (13)
    profile/             ← profils, stats, followers (17)
    lists/               ← listes, collaboration (8)
    search/              ← barre, suggestions, filtres (8)
    feed/                ← activités, feed social (6)
    layout/              ← shell, navigation, SW (8)
    admin/               ← dashboard, gestion (~25)
    scan/                ← scanner ISBN (4)
    wrapped/             ← année en revue (4)
    blog/                ← articles (2)
    editorial/           ← listes éditoriales (2)
    notifications/       ← centre notifs (2)
    pwa/                 ← install, offline (2)
    auth/                ← login/signup forms (2)
    seo/                 ← JSON-LD schemas (6)
    feedback/            ← formulaire feedback (1)
    analytics/           ← wrapper analytics (1)
    providers/           ← React Query provider (1)
  lib/
    auth/                ← NextAuth config, session, admin guard
    supabase/            ← clients DB (public + service role)
    google-books/        ← API client + quota tracker
    storage/             ← covers, avatars upload
    email/               ← envoi emails (Resend)
    pwa/                 ← offline queue, sync, push
    analytics/           ← tracking (page/book/blog views)
    isbn.ts              ← validation ISBN-10/13
    open-library.ts      ← API Open Library
    nytimes.ts           ← API NY Times
    slug.ts, datetime.ts, utils.ts
  features/              ← modules métier (server functions + hooks)
    admin/               ← stats, users, books, blog, feedback, tags, feelings
    books/               ← readers, feelings, similar
    editorial/           ← listes éditoriales admin/public
    lists/               ← listes utilisateur
    profile/             ← dashboard, profil public
    search/              ← types + React Query hooks
    scan/                ← hook ISBN lookup
    feed/                ← types, condensation, query
    wrapped/             ← stats annuelles
  server/actions/        ← Server Actions (mutations)
  hooks/                 ← use-install-prompt, use-offline-queue
  stores/                ← Zustand (minimal)
  types/                 ← types partagés
```

---

## Pages & Routes

### Auth — `(auth)/`

| Route | Description |
|-------|-------------|
| `/login` | Connexion (credentials) |
| `/signup` | Création de compte |

### App — `(app)/`

| Route | Description |
|-------|-------------|
| `/` | Accueil (listes éditoriales, blog, listes communauté) |
| `/feed` | Feed social (activités suivis) |
| `/search` | Recherche globale (livres, users, blog) |
| `/notifications` | Centre de notifications |
| `/books/[slug]` | Fiche livre |
| `/books/create` | Ajout manuel d'un livre |
| `/lists` | Dashboard listes utilisateur |
| `/lists/[listId]` | Détail liste |
| `/lists/create` | Création liste |
| `/profiles/me` | Profil personnel |
| `/profiles/[username]` | Profil public |
| `/profiles/[username]/books` | Livres d'un utilisateur |
| `/profiles/[username]/lists` | Listes d'un utilisateur |
| `/profiles/[username]/followers` | Followers |
| `/tendances/[listId]` | Détail liste éditoriale |
| `/wrapped/[year]` | Année en revue |
| `/blog` | Index blog |
| `/blog/[slug]` | Article blog |
| `/feedback` | Formulaire feedback |
| `/about` | À propos |
| `/faq` | FAQ |
| `/offline` | Fallback hors-ligne |

### Admin — `/admin/` (protégé middleware `isAdmin`)

| Route | Description |
|-------|-------------|
| `/admin` | Dashboard |
| `/admin/analytics` | Console analytics |
| `/admin/books` | Gestion livres |
| `/admin/books/[bookId]` | Détail/édition livre |
| `/admin/users` | Gestion utilisateurs |
| `/admin/users/[userId]` | Détail utilisateur |
| `/admin/blog` | Gestion blog |
| `/admin/blog/new` | Nouvel article |
| `/admin/blog/[postId]/edit` | Édition article |
| `/admin/tags` | Gestion tags |
| `/admin/emails` | Logs emails |
| `/admin/feedback` | Inbox feedback |
| `/admin/system` | Paramètres système |
| `/admin/tendances` | Gestion tendances |
| `/admin/tendances/new` | Nouvelle liste éditoriale |
| `/admin/tendances/[listId]` | Édition liste éditoriale |

---

## Routes API

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/auth/[...nextauth]` | * | NextAuth handler |
| `/api/books/search` | GET | Recherche livres (Supabase + Google Books + OpenLibrary) |
| `/api/books/isbn/[isbn]` | GET | Lookup ISBN multi-sources |
| `/api/search/suggestions` | GET | Suggestions de recherche |
| `/api/search/blog` | GET | Recherche blog |
| `/api/users/search` | GET | Recherche utilisateurs |
| `/api/tags` | GET | Tags disponibles |
| `/api/feed` | GET | Données feed |
| `/api/analytics/page-view` | POST | Tracking page view |
| `/api/storage/covers/upload` | POST | Upload couverture livre |
| `/api/storage/avatars/upload` | POST | Upload avatar |
| `/api/pwa/offline-actions` | POST | Sync actions offline |
| `/api/pwa/push/subscribe` | POST | Inscription push notifications |
| `/api/admin/stats/[type]` | GET | Stats admin |
| `/api/admin/backfill-2025` | POST | Backfill données |
| `/api/cron/fetch-nytimes-bestsellers` | POST | Cron NY Times |
| `/api/cron/aggregate-semester-bestsellers` | POST | Cron agrégation tendances |

> Les mutations principales passent par **Server Actions** (`src/server/actions/`), pas par des routes API.

### Server Actions principales

| Module | Actions |
|--------|---------|
| `book.ts` | Ajout/update statut lecture, notation |
| `review.ts` | CRUD avis |
| `lists.ts` | CRUD listes, gestion items |
| `follow.ts` | Follow/unfollow, demandes |
| `profile.ts` | Mise à jour profil, bio, avatar |
| `auth.ts` | Inscription, connexion |
| `feedback.ts` | Soumission feedback |
| `notifications.ts` | Gestion notifications |
| `recommend.ts` | Recommandations |
| `import-google-books.ts` | Import depuis Google Books |
| `import-open-library.ts` | Import depuis Open Library |
| `resolve-editorial-book.ts` | Résolution livres éditoriaux |
| `admin/*.ts` | Users, books, blog, tags, feedback, feelings, editorial, system, export |

---

## Base de données (PostgreSQL / Supabase)

RLS activé sur toutes les tables. UUIDs, timestamps `created_at`/`updated_at`.

### Tables principales

**Utilisateurs & Social**
- `users` — id, email, username, display_name, password_hash, avatar_url, bio, is_admin, disabled_at
- `follows` — follower_id, following_id
- `follow_requests` — id, requester_id, target_id, status

**Livres**
- `books` — id, open_library_id, google_books_id, isbn, title, author, cover_url, publisher, language, publication_year, summary, average_rating, ratings_count, created_by
- `tags` — id, name, slug
- `book_tags` — book_id, tag_id

**Interactions utilisateur ↔ livre**
- `user_books` — id, user_id, book_id, status (`to_read`|`reading`|`finished`), rating, rated_at, note_private
- `reviews` — id, user_id, book_id, visibility (`public`|`friends`|`private`), title, content, spoiler
- `review_comments` — id, review_id, user_id, content
- `review_likes` — review_id, user_id
- `feeling_keywords` — id, label, slug, source (`admin`|`user`), created_by
- `user_book_feelings` — id, user_id, book_id, keyword_id, visibility

**Listes**
- `lists` — id, owner_id, title, description, visibility (`public`|`unlisted`|`private`), is_collaborative
- `list_items` — id, list_id, book_id, position, note
- `list_collaborators` — list_id, user_id, role (`editor`|`viewer`)

**Feed & Notifications**
- `activities` — id, user_id, type (`rating`|`review`|`status_change`|`list_update`|`follow`), payload (jsonb)
- `notifications` — id, user_id, type, payload (jsonb), read_at
- `recommendations` — id, user_id, book_id, source (`friends`|`global`|`similar`), score, metadata (jsonb)

**Contenu éditorial**
- `editorial_lists` — listes curées admin (period_type, semester_label, period_start/end)
- `editorial_list_books` — livres dans listes éditoriales (appearances, avg_rank, best_rank, aggregate_score)
- `blog_posts` — id, slug, title, description, body, image_url, status (`draft`|`published`|`archived`), author_id
- `nytimes_weekly_rankings` — staging NY Times bestsellers

**Analytics & Système**
- `page_views` — path, referrer, user_agent, user_id, session_id, country
- `book_views` — book_id, user_id, session_id
- `blog_views` — slug, user_id, session_id
- `email_logs` — email_type, recipient_email, subject, status, resend_id, error_message
- `google_books_quota` — date, request_count
- `feedbacks` — id, user_id, type (`bug`|`suggestion`), title, description, browser_info, status

---

## Auth

- **NextAuth.js** avec stratégie JWT
- **CredentialsProvider** (email/password, hash bcrypt)
- Session stockée dans JWT token (inclut `isAdmin`)
- **Middleware** (`src/middleware.ts`) : protège `/admin/*`, redirige non-auth vers `/login`
- Supabase PostgreSQL pour stockage users (pas Supabase Auth)

---

## État client

- **TanStack Query** — données serveur (feed, recherche, listes, profils)
- **Zustand** — état UI local (filtres, modals, toasts)
- **Server Actions** — mutations qui invalident les caches Query
