-- ============================================================================
-- DISCOVER WISHLIST — MIGRATION
-- ----------------------------------------------------------------------------
-- Table dédiée à la feature /discover (swipe-deck Tinder-like).
-- Séparée de user_books car wishlist = "envie", pas statut de lecture.
-- Un livre peut être à la fois en wishlist ET dans user_books (ex: l'utilisateur
-- range plus tard via le panel détaillé).
-- ============================================================================

create table if not exists public.discover_wishlist (
  user_id uuid not null references public.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create index if not exists idx_discover_wishlist_user_created
  on public.discover_wishlist (user_id, created_at desc);

alter table public.discover_wishlist enable row level security;

drop policy if exists "discover_wishlist_owner_read" on public.discover_wishlist;
create policy "discover_wishlist_owner_read" on public.discover_wishlist
  for select using (auth.uid() = user_id);

drop policy if exists "discover_wishlist_owner_insert" on public.discover_wishlist;
create policy "discover_wishlist_owner_insert" on public.discover_wishlist
  for insert with check (auth.uid() = user_id);

drop policy if exists "discover_wishlist_owner_delete" on public.discover_wishlist;
create policy "discover_wishlist_owner_delete" on public.discover_wishlist
  for delete using (auth.uid() = user_id);
