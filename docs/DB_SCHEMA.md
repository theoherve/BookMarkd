# DB SCHEMA

Modèle conceptuel pour PostgreSQL. Toutes les clés primaires sont des UUID (`uuid_generate_v4()`), timestamps `created_at`, `updated_at` avec trigger automatique. Les `status` et `visibility` utilisent des enums PostgreSQL.

## Tables principales

### `users`

- `id`
- `email` (unique)
- `username` (unique)
- `hashed_password`
- `display_name`
- `bio`
- `avatar_url`
- `location`
- `preferences` (jsonb : langue, thème)

### `books`

- `id`
- `open_library_id` (nullable, unique)
- `title`
- `author`
- `cover_url`
- `publication_year`
- `summary`
- `average_rating` (materialized, float)
- `ratings_count`
- `created_by` (FK `users.id`)

### `tags`

- `id`
- `name` (unique, ex. “Fantasy”)
- `slug`

### `book_tags`

- `book_id` FK `books`
- `tag_id` FK `tags`
- PK composite (`book_id`, `tag_id`)

### `user_books`

Relation utilisateur ↔ livre + statut.

- `id`
- `user_id`
- `book_id`
- `status` enum (`to_read`, `reading`, `finished`)
- `rating` (decimal 0.5 → 5.0)
- `rated_at`
- `notes` (private)

### `reviews`

- `id`
- `user_id`
- `book_id`
- `visibility` enum (`public`, `friends`, `private`)
- `title`
- `content`
- `spoiler` (bool)

### `review_likes`

- `review_id`
- `user_id`
- PK composite.

### `review_comments`

- `id`
- `review_id`
- `user_id`
- `content`
- timestamps

### `lists`

- `id`
- `owner_id`
- `title`
- `description`
- `visibility` enum (`public`, `unlisted`, `private`)
- `is_collaborative` (bool)

### `list_items`

- `id`
- `list_id`
- `book_id`
- `position` (int)
- `note` (nullable)

### `list_collaborators`

- `list_id`
- `user_id`
- `role` (`editor`, `viewer`)

### `follows`

- `follower_id`
- `following_id`
- `created_at`
- PK composite, index pour mutual follows.

### `activities`

- `id`
- `user_id`
- `type` enum (`rating`, `review`, `status_change`, `list_update`, `follow`)
- `payload` jsonb (détails)
- Index sur `created_at` pour feed.

### `recommendations`

- `id`
- `user_id`
- `book_id`
- `source` enum (`friends`, `global`, `similar`)
- `score` numeric
- `metadata` jsonb (pour explication)

### `notifications` (futur)

- `id`
- `user_id`
- `type`
- `payload`
- `read_at`

## Contraintes & Index

- Index full-text (`GIN`) sur `books.title`, `books.author`, `books.summary`.
- `book_tags` index sur `tag_id` pour filtres.
- `user_books` index composite (`user_id`, `status`).
- `reviews` index sur `visibility`, `created_at`.
- `review_comments` index sur `review_id`.
- `list_collaborators` index sur `list_id`.
- `activities` partitionnement futur par mois si volumétrie.

## Seed & Fixtures

- Scripts `pnpm db:seed` pour :
  - Utilisateurs démo.
  - Livres populaires (via Open Library snapshot).
  - Listes thématiques.
  - Activités fictives pour tests UI.

## Synchronisation Open Library

- Table `import_jobs` (id, status, payload, error) pour suivre les imports batch.
- Stockage covers dans Supabase Storage (`covers/{bookId}.jpg`).


