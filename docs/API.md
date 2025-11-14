# API & Services

Next.js App Router fournit les handlers API (`app/api`). Les mutations critiques utilisent Server Actions sécurisées (auth obligatoire). Toutes les réponses sont en JSON, validées par Zod.

## Auth (`/api/auth/[...nextauth]`)

- Provider credentials (email + mot de passe).
- OAuth (Google, Apple) – futur.
- Sessions JWT + cookies sécurisés.
- Server Action `registerUser` : création compte credentials (hash bcrypt, vérif unicité).

## Utilisateurs

| Endpoint | Méthode | Description | Payload | Réponse |
|----------|---------|-------------|---------|---------|
| `/api/users/me` | GET | Profil courant | — | `UserProfile` |
| `/api/users/[username]` | GET | Profil public | — | `PublicProfile` |
| `/api/users/follow` | POST | Suivre / unfollow | `{ targetUserId, action }` | `FollowStatus` |
| `/api/users/activities` | GET | Activité paginée | query : `page`, `cursor` | `ActivityFeed[]` |

## Livres

| Endpoint | Méthode | Description | Payload | Réponse |
|----------|---------|-------------|---------|---------|
| `/api/books/search` | GET | Recherche avancée (Supabase + Open Library) | query : `q`, `genre`, `external` (bool) | `{ books: SearchBook[], supabaseCount, externalCount }` |
| `/api/books` | POST | Ajouter un livre manuel | `CreateBookInput` | `BookDetail` |
| `/api/books/[bookId]` | GET | Détails livre | — | `BookDetail` |
| `/api/books/[bookId]/rate` | POST | Noter | `{ rating }` | `RatingResponse` |
| `/api/books/[bookId]/status` | POST | Mettre à jour statut | `{ status }` | `StatusResponse` |
| `/api/books/[bookId]/reviews` | POST | Créer commentaire | `CreateReviewInput` | `Review` |
| `/api/tags` | GET | Liste des tags disponibles | — | `{ tags: Tag[] }` |

- Server Actions associées :
  - `updateReadingStatus`, `rateBook`, `createReview`, `addReviewComment`.
  - `addBookToReadlist` (readlist Supabase).
  - `importOpenLibraryBook` pour ajouter un ouvrage externe au catalogue.

## Listes personnalisées

| Endpoint | Méthode | Description | Payload | Réponse |
|----------|---------|-------------|---------|---------|
| `/api/lists` | GET | Listes de l’utilisateur | query : `visibility` | `ListSummary[]` |
| `/api/lists` | POST | Créer une liste | `CreateListInput` | `ListDetail` |
| `/api/lists/[listId]` | GET | Détails liste | — | `ListDetail` |
| `/api/lists/[listId]` | PATCH | Modifier liste | `UpdateListInput` | `ListDetail` |
| `/api/lists/[listId]` | DELETE | Supprimer | — | `{ success: boolean }` |

## Feed & Recommandations

| Endpoint | Méthode | Description | Payload | Réponse |
|----------|---------|-------------|---------|---------|
| `/api/feed` | GET | Feed combiné (activités + lectures amis + recommandations) | — | `FeedResponse` (`activities`, `friendsBooks`, `recommendations`) |
| `/api/recommendations` | GET | Suggestions personnalisées | query : `type` (`friends`, `global`, `similar`) | `Recommendation[]` |

## Likes & Interactions

| Endpoint | Méthode | Description | Payload | Réponse |
|----------|---------|-------------|---------|---------|
| `/api/reviews/[reviewId]/like` | POST | Like/unlike commentaire | `{ action }` | `LikeStatus` |

## Intégration Open Library

- Service côté serveur `lib/api/open-library.ts`.
- Cache côté serveur (revalidation 24h).
- Normalisation des données → `BookDetail`.

## Validation & Sécurité

- Tous les payloads sont validés par Zod (`lib/validation`).
- Ratelimits (Upstash Redis) sur endpoints sensibles (`POST`, `search`).
- Vérification auth via NextAuth middleware (`middleware.ts`).

## Notifications (futur)

- `/api/notifications` (GET) : liste non lues.
- Webhooks Stripe (premium) → `/api/webhooks/stripe`.
- Webpush / Email (Resend) sur nouvelles activités.


