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
  average_rating numeric(3, 2) default 0,
  ratings_count int default 0,
  created_by uuid references public.users(id) on delete
  set null,
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
  rating numeric(2, 1),
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
create table if not exists public.review_comments (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
create table if not exists public.list_collaborators (
  list_id uuid references public.lists(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role text not null check (role in ('editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (list_id, user_id)
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
  type text not null check (
    type in (
      'rating',
      'review',
      'status_change',
      'list_update',
      'follow'
    )
  ),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.recommendations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  source text not null check (source in ('friends', 'global', 'similar')),
  score numeric(5, 2) not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
-- 3) Indexes complémentaires --------------------------------------------------
create index if not exists idx_books_title on public.books using gin (to_tsvector('french', title));
create index if not exists idx_books_author on public.books using gin (to_tsvector('french', author));
create index if not exists idx_user_books_user_id_status on public.user_books (user_id, status);
create index if not exists idx_reviews_book_id_visibility on public.reviews (book_id, visibility);
create index if not exists idx_activities_created_at on public.activities (created_at desc);
create index if not exists idx_review_comments_review_id on public.review_comments (review_id);
create index if not exists idx_list_collaborators_list_id on public.list_collaborators (list_id);
-- 4) Activation RLS ----------------------------------------------------------
alter table public.books enable row level security;
alter table public.book_tags enable row level security;
alter table public.tags enable row level security;
alter table public.user_books enable row level security;
alter table public.reviews enable row level security;
alter table public.review_likes enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;
alter table public.list_collaborators enable row level security;
alter table public.follows enable row level security;
alter table public.activities enable row level security;
alter table public.recommendations enable row level security;
alter table public.review_comments enable row level security;
-- 5) Policies minimales (à affiner selon produit) ----------------------------
-- Books : lecture publique, écriture restreinte aux admins (placeholder).
drop policy if exists "books_read_public" on public.books;
create policy "books_read_public" on public.books for
select using (true);
-- Tags : lecture publique.
drop policy if exists "tags_read_public" on public.tags;
create policy "tags_read_public" on public.tags for
select using (true);
drop policy if exists "book_tags_read_public" on public.book_tags;
create policy "book_tags_read_public" on public.book_tags for
select using (true);
-- user_books : accès restreint au propriétaire.
drop policy if exists "user_books_owner_read" on public.user_books;
create policy "user_books_owner_read" on public.user_books for
select using (auth.uid() = user_id);
drop policy if exists "user_books_owner_write" on public.user_books;
create policy "user_books_owner_write" on public.user_books for
insert with check (auth.uid() = user_id);
drop policy if exists "user_books_owner_update" on public.user_books;
create policy "user_books_owner_update" on public.user_books for
update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "user_books_owner_delete" on public.user_books;
create policy "user_books_owner_delete" on public.user_books for delete using (auth.uid() = user_id);
-- reviews : lecture publique pour visibilité "public", lecture amis/follow (à compléter), écriture propriétaire.
drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews for
select using (
    visibility = 'public'
    or auth.uid() = user_id
  );
drop policy if exists "reviews_owner_write" on public.reviews;
create policy "reviews_owner_write" on public.reviews for
insert with check (auth.uid() = user_id);
drop policy if exists "reviews_owner_update" on public.reviews;
create policy "reviews_owner_update" on public.reviews for
update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- review_comments : propriétaire review ou auteur du commentaire.
drop policy if exists "review_comments_read" on public.review_comments;
create policy "review_comments_read" on public.review_comments for
select using (
    exists (
      select 1
      from public.reviews r
      where r.id = review_id
        and (
          r.visibility = 'public'
          or auth.uid() = r.user_id
          or auth.uid() = user_id
        )
    )
  );
drop policy if exists "review_comments_write" on public.review_comments;
create policy "review_comments_write" on public.review_comments for
insert with check (auth.uid() = user_id);
drop policy if exists "review_comments_update" on public.review_comments;
create policy "review_comments_update" on public.review_comments for
update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "review_comments_delete" on public.review_comments;
create policy "review_comments_delete" on public.review_comments for delete using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.reviews r
    where r.id = review_id
      and auth.uid() = r.user_id
  )
);
-- lists : visibilité gérée par colonne visibility (policies simples pour démarrer).
drop policy if exists "lists_read_public_or_owner" on public.lists;
create policy "lists_read_public_or_owner" on public.lists for
select using (
    visibility = 'public'
    or auth.uid() = owner_id
    or exists (
      select 1
      from public.list_collaborators c
      where c.list_id = id
        and c.user_id = auth.uid()
    )
  );
drop policy if exists "lists_owner_write" on public.lists;
create policy "lists_owner_write" on public.lists for
insert with check (auth.uid() = owner_id);
drop policy if exists "lists_owner_update" on public.lists;
create policy "lists_owner_update" on public.lists for
update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "lists_owner_delete" on public.lists;
create policy "lists_owner_delete" on public.lists for delete using (auth.uid() = owner_id);
-- list_items : restreint aux propriétaires (et collaborateurs à venir).
drop policy if exists "list_items_owner_read" on public.list_items;
create policy "list_items_owner_read" on public.list_items for
select using (
    exists (
      select 1
      from public.lists l
      where l.id = list_id
        and (
          l.visibility = 'public'
          or auth.uid() = l.owner_id
          or exists (
            select 1
            from public.list_collaborators c
            where c.list_id = l.id
              and c.user_id = auth.uid()
          )
        )
    )
  );
drop policy if exists "list_items_owner_write" on public.list_items;
create policy "list_items_owner_write" on public.list_items for
insert with check (
    exists (
      select 1
      from public.lists l
      where l.id = list_id
        and (
          auth.uid() = l.owner_id
          or exists (
            select 1
            from public.list_collaborators c
            where c.list_id = l.id
              and c.user_id = auth.uid()
              and c.role = 'editor'
          )
        )
    )
  );
drop policy if exists "list_items_owner_update" on public.list_items;
create policy "list_items_owner_update" on public.list_items for
update using (
    exists (
      select 1
      from public.lists l
      where l.id = list_id
        and (
          auth.uid() = l.owner_id
          or exists (
            select 1
            from public.list_collaborators c
            where c.list_id = l.id
              and c.user_id = auth.uid()
              and c.role = 'editor'
          )
        )
    )
  ) with check (
    exists (
      select 1
      from public.lists l
      where l.id = list_id
        and (
          auth.uid() = l.owner_id
          or exists (
            select 1
            from public.list_collaborators c
            where c.list_id = l.id
              and c.user_id = auth.uid()
              and c.role = 'editor'
          )
        )
    )
  );
-- list_collaborators : propriétaire ou collaborateur concerné.
drop policy if exists "list_collaborators_read" on public.list_collaborators;
create policy "list_collaborators_read" on public.list_collaborators for
select using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.lists l
      where l.id = list_id
        and auth.uid() = l.owner_id
    )
  );
drop policy if exists "list_collaborators_write" on public.list_collaborators;
create policy "list_collaborators_write" on public.list_collaborators for
insert with check (
    exists (
      select 1
      from public.lists l
      where l.id = list_id
        and auth.uid() = l.owner_id
    )
  );
drop policy if exists "list_collaborators_delete" on public.list_collaborators;
create policy "list_collaborators_delete" on public.list_collaborators for delete using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.lists l
    where l.id = list_id
      and auth.uid() = l.owner_id
  )
);
-- follows : propriétaire seulement.
drop policy if exists "follows_owner_read" on public.follows;
create policy "follows_owner_read" on public.follows for
select using (auth.uid() = follower_id);
drop policy if exists "follows_owner_write" on public.follows;
create policy "follows_owner_write" on public.follows for
insert with check (auth.uid() = follower_id);
drop policy if exists "follows_owner_delete" on public.follows;
create policy "follows_owner_delete" on public.follows for delete using (auth.uid() = follower_id);
-- activities : lecture publique (feed global) mais possibilité de restreindre plus tard.
drop policy if exists "activities_read_public" on public.activities;
create policy "activities_read_public" on public.activities for
select using (true);
drop policy if exists "activities_owner_write" on public.activities;
create policy "activities_owner_write" on public.activities for
insert with check (auth.uid() = user_id);
-- recommendations : lecture propriétaire, insertion service (via service role).
drop policy if exists "recommendations_owner_read" on public.recommendations;
create policy "recommendations_owner_read" on public.recommendations for
select using (auth.uid() = user_id);
-- NOTE : L’insertion dans recommendations se fera via service role (pas besoin de policy).
-- ============================================================================
-- Après exécution :
--   - Lancer supabase/seed.sql pour injecter la démo utilisateur.
--   - Compléter les policies (amis, collaborations) avant mise en prod.
-- ============================================================================