-- ============================================================================
-- BookMarkd – Schéma Supabase
-- ----------------------------------------------------------------------------
-- ⚠️ À exécuter dans l’éditeur SQL Supabase (schema public)
--     1. Activez les extensions nécessaires
--     2. Créez les tables
--     3. Activez RLS + policies minimales
-- ============================================================================

-- 1) Extensions utiles -------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2) Tables ------------------------------------------------------------------

-- Users (identiques à seed.sql). Garder synchronisé avec NextAuth.
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  display_name text not null,
  password_hash text not null,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default uuid_generate_v4(),
  open_library_id text unique,
  title text not null,
  author text not null,
  cover_url text,
  publication_year int,
  summary text,
  average_rating numeric(3,2) default 0,
  ratings_count int default 0,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.book_tags (
  book_id uuid references public.books(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (book_id, tag_id)
);

create table if not exists public.user_books (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  status text not null check (status in ('to_read', 'reading', 'finished')),
  rating numeric(2,1),
  rated_at timestamptz,
  note_private text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, book_id)
);

create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  visibility text not null check (visibility in ('public', 'friends', 'private')),
  title text,
  content text not null,
  spoiler boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.review_likes (
  review_id uuid references public.reviews(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

create table if not exists public.lists (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  visibility text not null check (visibility in ('public', 'unlisted', 'private')),
  is_collaborative boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.list_items (
  id uuid primary key default uuid_generate_v4(),
  list_id uuid not null references public.lists(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  position int not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (list_id, book_id)
);

create table if not exists public.follows (
  follower_id uuid references public.users(id) on delete cascade,
  following_id uuid references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

create table if not exists public.activities (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('rating', 'review', 'status_change', 'list_update', 'follow')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  source text not null check (source in ('friends', 'global', 'similar')),
  score numeric(5,2) not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- 3) Indexes complémentaires --------------------------------------------------
create index if not exists idx_books_title on public.books using gin (to_tsvector('french', title));
create index if not exists idx_books_author on public.books using gin (to_tsvector('french', author));
create index if not exists idx_user_books_user_id_status on public.user_books (user_id, status);
create index if not exists idx_reviews_book_id_visibility on public.reviews (book_id, visibility);
create index if not exists idx_activities_created_at on public.activities (created_at desc);

-- 4) Activation RLS ----------------------------------------------------------
alter table public.books enable row level security;
alter table public.book_tags enable row level security;
alter table public.tags enable row level security;
alter table public.user_books enable row level security;
alter table public.reviews enable row level security;
alter table public.review_likes enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;
alter table public.follows enable row level security;
alter table public.activities enable row level security;
alter table public.recommendations enable row level security;

-- 5) Policies minimales (à affiner selon produit) ----------------------------

-- Books : lecture publique, écriture restreinte aux admins (placeholder).
create policy if not exists "books_read_public"
  on public.books
  for select
  using (true);

-- Tags : lecture publique.
create policy if not exists "tags_read_public"
  on public.tags
  for select
  using (true);

create policy if not exists "book_tags_read_public"
  on public.book_tags
  for select
  using (true);

-- user_books : accès restreint au propriétaire.
create policy if not exists "user_books_owner_read"
  on public.user_books
  for select
  using (auth.uid() = user_id);

create policy if not exists "user_books_owner_write"
  on public.user_books
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "user_books_owner_update"
  on public.user_books
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "user_books_owner_delete"
  on public.user_books
  for delete
  using (auth.uid() = user_id);

-- reviews : lecture publique pour visibilité "public", lecture amis/follow (à compléter), écriture propriétaire.
create policy if not exists "reviews_public_read"
  on public.reviews
  for select
  using (
    visibility = 'public'
    or auth.uid() = user_id
  );

create policy if not exists "reviews_owner_write"
  on public.reviews
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "reviews_owner_update"
  on public.reviews
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- lists : visibilité gérée par colonne visibility (policies simples pour démarrer).
create policy if not exists "lists_read_public_or_owner"
  on public.lists
  for select
  using (
    visibility = 'public'
    or auth.uid() = owner_id
  );

create policy if not exists "lists_owner_write"
  on public.lists
  for insert
  with check (auth.uid() = owner_id);

create policy if not exists "lists_owner_update"
  on public.lists
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy if not exists "lists_owner_delete"
  on public.lists
  for delete
  using (auth.uid() = owner_id);

-- list_items : restreint aux propriétaires (et collaborateurs à venir).
create policy if not exists "list_items_owner_read"
  on public.list_items
  for select
  using (
    exists (
      select 1
      from public.lists l
      where l.id = list_id and (l.visibility = 'public' or auth.uid() = l.owner_id)
    )
  );

create policy if not exists "list_items_owner_write"
  on public.list_items
  for insert
  with check (
    exists (
      select 1
      from public.lists l
      where l.id = list_id and auth.uid() = l.owner_id
    )
  );

create policy if not exists "list_items_owner_update"
  on public.list_items
  for update
  using (
    exists (
      select 1
      from public.lists l
      where l.id = list_id and auth.uid() = l.owner_id
    )
  )
  with check (
    exists (
      select 1
      from public.lists l
      where l.id = list_id and auth.uid() = l.owner_id
    )
  );

-- follows : propriétaire seulement.
create policy if not exists "follows_owner_read"
  on public.follows
  for select
  using (auth.uid() = follower_id);

create policy if not exists "follows_owner_write"
  on public.follows
  for insert
  with check (auth.uid() = follower_id);

create policy if not exists "follows_owner_delete"
  on public.follows
  for delete
  using (auth.uid() = follower_id);

-- activities : lecture publique (feed global) mais possibilité de restreindre plus tard.
create policy if not exists "activities_read_public"
  on public.activities
  for select
  using (true);

create policy if not exists "activities_owner_write"
  on public.activities
  for insert
  with check (auth.uid() = user_id);

-- recommendations : lecture propriétaire, insertion service (via service role).
create policy if not exists "recommendations_owner_read"
  on public.recommendations
  for select
  using (auth.uid() = user_id);

-- NOTE : L’insertion dans recommendations se fera via service role (pas besoin de policy).

-- ============================================================================
-- Après exécution :
--   - Lancer supabase/seed.sql pour injecter la démo utilisateur.
--   - Compléter les policies (amis, collaborations) avant mise en prod.
-- ============================================================================

