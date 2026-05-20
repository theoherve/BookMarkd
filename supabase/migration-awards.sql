-- ============================================================================
-- Migration: BookMarkd Awards
-- ----------------------------------------------------------------------------
-- Événement annuel automatique avec rankings publics calculés sur année N-1.
-- Premier run réel : 1er janvier 2027 sur 2026. Pas d'awards 2025 (check DB).
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Table awards_years
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.awards_years (
  year int primary key check (year >= 2026),
  status text not null check (status in ('draft', 'published', 'archived')) default 'draft',
  theme text,
  intro text,
  summary jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_awards_years_status
  on public.awards_years (status);

drop trigger if exists update_awards_years_updated_at on public.awards_years;
create trigger update_awards_years_updated_at before update
  on public.awards_years for each row
  execute function update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Table awards_winners (snapshot figé)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.awards_winners (
  id uuid primary key default uuid_generate_v4(),
  year int not null references public.awards_years(year) on delete cascade,
  category text not null check (category in (
    'book_of_the_year',
    'reader_of_the_year',
    'top_categories',
    'top_reviewer',
    'most_loved_review',
    'trending_wishlist',
    'best_newcomer',
    'feeling_award'
  )),
  rank int not null check (rank between 1 and 5),
  winner_type text not null check (winner_type in ('book', 'user', 'tag', 'review', 'feeling_book')),
  winner_id uuid,
  snapshot jsonb not null,
  score numeric(10, 4) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (year, category, rank)
);

create index if not exists idx_awards_winners_year_category
  on public.awards_winners (year, category, rank);

create index if not exists idx_awards_winners_user_lookup
  on public.awards_winners (winner_type, winner_id)
  where winner_type = 'user';

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Indexes perf agrégation cron sur tables existantes
-- ═══════════════════════════════════════════════════════════════════════════

create index if not exists idx_reviews_created_at
  on public.reviews (created_at desc);

create index if not exists idx_reviews_user_visibility_created
  on public.reviews (user_id, visibility, created_at desc);

create index if not exists idx_user_books_finished_updated
  on public.user_books (updated_at desc)
  where status = 'finished';

create index if not exists idx_user_books_book_finished
  on public.user_books (book_id)
  where status = 'finished';

create index if not exists idx_users_created_at
  on public.users (created_at desc);

create index if not exists idx_review_likes_review_created
  on public.review_likes (review_id, created_at desc);

create index if not exists idx_discover_wishlist_book_created
  on public.discover_wishlist (book_id, created_at desc);

create index if not exists idx_user_book_feelings_book_keyword_visibility
  on public.user_book_feelings (book_id, keyword_id, visibility);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. RLS — lecture publique uniquement si year published
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.awards_years enable row level security;
alter table public.awards_winners enable row level security;

drop policy if exists "awards_years_published_read" on public.awards_years;
create policy "awards_years_published_read" on public.awards_years
  for select using (status = 'published');

drop policy if exists "awards_winners_published_read" on public.awards_winners;
create policy "awards_winners_published_read" on public.awards_winners
  for select using (
    exists (
      select 1
      from public.awards_years y
      where y.year = awards_winners.year
        and y.status = 'published'
    )
  );

-- Inserts/updates via service_role (bypass RLS automatiquement).

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. Extension contrainte notifications.type pour awards
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'follow_request',
    'follow_request_accepted',
    'follow',
    'review_like',
    'review_comment',
    'recommendation',
    'feedback_resolved',
    'awards_announcement',
    'awards_winner'
  ));
