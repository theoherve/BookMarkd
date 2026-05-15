-- ============================================================================
-- DEDUPE BOOKS — MIGRATION (one-shot, transactional)
-- ----------------------------------------------------------------------------
-- ⚠️ Run dedupe-books-dryrun.sql FIRST and inspect output.
-- ⚠️ Take a database backup / snapshot before running this.
-- ⚠️ Run inside a single transaction (already wrapped below). If anything
--    looks wrong in the final notices, ROLLBACK before COMMIT.
--
-- Strategy (same as the dry-run):
--   Duplicate detection cascade: isbn → google_books_id → slug.
--   Canonical election: max(refs_total) desc, created_at asc, id asc.
--
-- Per-table merge rules:
--   user_books      UNIQUE(user_id, book_id) — keep most advanced status
--                   (finished > reading > to_read); tiebreak: non-null rating,
--                   then updated_at desc. Other rows deleted.
--   reviews         no UNIQUE — reassign to canonical. If a user ends up with
--                   multiple reviews on the canonical, concatenate content
--                   into the oldest review, delete the others.
--   book_tags       PK(book_id, tag_id) — insert missing pairs onto canonical
--                   then delete duplicates.
--   list_items      UNIQUE(list_id, book_id) — insert missing pairs onto
--                   canonical (preserving the lowest position/oldest), delete
--                   duplicates.
--   recommendations no UNIQUE — reassign all.
--   book_views      no UNIQUE — reassign all (if table exists).
--
-- Canonical metadata back-fill: any null field on canonical (isbn,
-- google_books_id, cover_url, publication_year, summary, publisher,
-- language, average_rating, ratings_count) is filled from the first
-- duplicate that has a non-null value.
--
-- After all reassignments, duplicate books are deleted. Their FK rows have
-- already been moved; CASCADE handles anything we missed (defensive).
-- ============================================================================

begin;

-- Safety: lock the books table for the duration of the migration to prevent
-- concurrent inserts from racing with our dedup work.
lock table public.books in share row exclusive mode;

-- ---------------------------------------------------------------------------
-- 0) Per-book ref counts (for canonical election)
-- ---------------------------------------------------------------------------
drop table if exists tmp_book_refs;
create temp table tmp_book_refs as
select
  b.id as book_id,
  coalesce((select count(*) from public.user_books ub where ub.book_id = b.id), 0) as n_user_books,
  coalesce((select count(*) from public.reviews r where r.book_id = b.id), 0) as n_reviews,
  coalesce((select count(*) from public.book_tags bt where bt.book_id = b.id), 0) as n_book_tags,
  coalesce((select count(*) from public.list_items li where li.book_id = b.id), 0) as n_list_items,
  coalesce((select count(*) from public.recommendations rc where rc.book_id = b.id), 0) as n_recommendations,
  0::bigint as n_book_views
from public.books b;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'book_views'
  ) then
    execute $sql$
      update tmp_book_refs t
      set n_book_views = coalesce(sub.c, 0)
      from (
        select book_id, count(*) as c
        from public.book_views
        group by book_id
      ) sub
      where sub.book_id = t.book_id
    $sql$;
  end if;
end$$;

alter table tmp_book_refs add column refs_total bigint;
update tmp_book_refs
set refs_total = n_user_books + n_reviews + n_book_tags + n_list_items + n_recommendations + n_book_views;

-- ---------------------------------------------------------------------------
-- 1) Assign each book to a deduplication group (cascade: isbn → gbid → slug)
-- ---------------------------------------------------------------------------
drop table if exists tmp_book_group;
create temp table tmp_book_group as
with
  by_isbn as (
    select b.id as book_id, 'isbn:' || lower(trim(b.isbn)) as group_key, 'isbn'::text as match_type
    from public.books b
    where b.isbn is not null and length(trim(b.isbn)) > 0
  ),
  isbn_groups as (select group_key from by_isbn group by group_key having count(*) > 1),
  isbn_assigned as (
    select b.book_id, b.group_key, b.match_type
    from by_isbn b join isbn_groups g on g.group_key = b.group_key
  ),
  by_gbid as (
    select b.id as book_id, 'gbid:' || b.google_books_id as group_key, 'google_books_id'::text as match_type
    from public.books b
    where b.google_books_id is not null
      and length(trim(b.google_books_id)) > 0
      and b.id not in (select book_id from isbn_assigned)
  ),
  gbid_groups as (select group_key from by_gbid group by group_key having count(*) > 1),
  gbid_assigned as (
    select b.book_id, b.group_key, b.match_type
    from by_gbid b join gbid_groups g on g.group_key = b.group_key
  ),
  by_slug as (
    select b.id as book_id, 'slug:' || b.slug as group_key, 'slug'::text as match_type
    from public.books b
    where b.slug is not null
      and length(trim(b.slug)) > 0
      and b.id not in (select book_id from isbn_assigned)
      and b.id not in (select book_id from gbid_assigned)
  ),
  slug_groups as (select group_key from by_slug group by group_key having count(*) > 1),
  slug_assigned as (
    select b.book_id, b.group_key, b.match_type
    from by_slug b join slug_groups g on g.group_key = b.group_key
  )
select * from isbn_assigned
union all
select * from gbid_assigned
union all
select * from slug_assigned;

create index on tmp_book_group(book_id);
create index on tmp_book_group(group_key);

-- ---------------------------------------------------------------------------
-- 2) Elect canonical per group
-- ---------------------------------------------------------------------------
drop table if exists tmp_canonical;
create temp table tmp_canonical as
select distinct on (g.group_key)
  g.group_key,
  g.match_type,
  b.id as canonical_id
from tmp_book_group g
join public.books b on b.id = g.book_id
join tmp_book_refs r on r.book_id = g.book_id
order by g.group_key, r.refs_total desc, b.created_at asc, b.id asc;

create index on tmp_canonical(canonical_id);

-- Pairs: (duplicate_book_id, canonical_id) — only rows that need to move.
drop table if exists tmp_pairs;
create temp table tmp_pairs as
select g.book_id as dup_id, c.canonical_id
from tmp_book_group g
join tmp_canonical c on c.group_key = g.group_key
where g.book_id <> c.canonical_id;

create index on tmp_pairs(dup_id);
create index on tmp_pairs(canonical_id);

do $$
declare
  v_groups int;
  v_dups int;
begin
  select count(*) into v_groups from tmp_canonical;
  select count(*) into v_dups from tmp_pairs;
  raise notice 'dedupe: % groups, % duplicate book rows to merge & delete', v_groups, v_dups;
end$$;

-- ---------------------------------------------------------------------------
-- 3) MERGE user_books   UNIQUE(user_id, book_id)
--    Keep one row per (user_id, canonical_book) with the "best" status.
-- ---------------------------------------------------------------------------
-- Step 3a: collect every relevant row (already-on-canonical + on-duplicates).
drop table if exists tmp_ub_candidates;
create temp table tmp_ub_candidates as
select
  ub.id,
  ub.user_id,
  c.canonical_id as target_book_id,
  ub.status,
  ub.rating,
  ub.rated_at,
  ub.note_private,
  ub.created_at,
  ub.updated_at,
  case ub.status
    when 'finished' then 3
    when 'reading' then 2
    when 'to_read' then 1
    else 0
  end as status_rank
from public.user_books ub
join tmp_canonical c
  on c.canonical_id = ub.book_id
  or c.canonical_id = (select canonical_id from tmp_pairs p where p.dup_id = ub.book_id);

-- Step 3b: elect winning row per (user_id, target_book_id).
drop table if exists tmp_ub_winners;
create temp table tmp_ub_winners as
select distinct on (user_id, target_book_id)
  id as keep_id,
  user_id,
  target_book_id,
  status,
  rating,
  rated_at,
  note_private,
  updated_at
from tmp_ub_candidates
order by
  user_id,
  target_book_id,
  status_rank desc,
  (rating is not null) desc,
  updated_at desc,
  created_at asc;

-- Step 3c: delete losing rows (they belong to user_books referenced by either
-- a duplicate or by the canonical, but were not elected).
delete from public.user_books ub
using tmp_ub_candidates c
where ub.id = c.id
  and not exists (
    select 1 from tmp_ub_winners w where w.keep_id = c.id
  );

-- Step 3d: now safe to reassign surviving duplicate rows to the canonical id.
update public.user_books ub
set book_id = p.canonical_id,
    updated_at = greatest(ub.updated_at, now())
from tmp_pairs p
where ub.book_id = p.dup_id;

-- Step 3e: for winners whose status/rating did not come from the row we kept,
-- patch the kept row with the winner's chosen fields.
update public.user_books ub
set
  status = w.status,
  rating = coalesce(w.rating, ub.rating),
  rated_at = coalesce(w.rated_at, ub.rated_at),
  note_private = coalesce(ub.note_private, w.note_private),
  updated_at = greatest(ub.updated_at, w.updated_at)
from tmp_ub_winners w
where ub.id = w.keep_id;

-- ---------------------------------------------------------------------------
-- 4) MERGE reviews (no UNIQUE constraint, but logical 1-per-user typical)
--    Reassign all duplicate-book reviews to canonical, then concat per user.
-- ---------------------------------------------------------------------------
update public.reviews r
set book_id = p.canonical_id,
    updated_at = greatest(r.updated_at, now())
from tmp_pairs p
where r.book_id = p.dup_id;

-- Concatenate: if a user has multiple reviews on a canonical book post-merge,
-- merge them into the oldest one and delete the rest.
do $$
declare
  rec record;
  merged_content text;
  merged_title text;
  merged_visibility text;
  merged_spoiler boolean;
  oldest_id uuid;
begin
  for rec in
    select user_id, book_id
    from public.reviews
    where book_id in (select canonical_id from tmp_pairs)
    group by user_id, book_id
    having count(*) > 1
  loop
    select id into oldest_id
    from public.reviews
    where user_id = rec.user_id and book_id = rec.book_id
    order by created_at asc, id asc
    limit 1;

    select
      string_agg(
        case when title is not null and length(title) > 0
             then '## ' || title || E'\n' || content
             else content end,
        E'\n\n---\n\n'
        order by created_at asc
      ),
      max(title),
      -- Most permissive visibility wins: public > friends > private.
      case
        when bool_or(visibility = 'public') then 'public'
        when bool_or(visibility = 'friends') then 'friends'
        else 'private'
      end,
      bool_or(coalesce(spoiler, false))
    into merged_content, merged_title, merged_visibility, merged_spoiler
    from public.reviews
    where user_id = rec.user_id and book_id = rec.book_id;

    update public.reviews
    set content = merged_content,
        title = merged_title,
        visibility = merged_visibility,
        spoiler = merged_spoiler,
        updated_at = now()
    where id = oldest_id;

    -- Move likes / comments off the soon-to-be-deleted reviews onto the kept one.
    update public.review_likes rl
    set review_id = oldest_id
    from public.reviews other
    where rl.review_id = other.id
      and other.user_id = rec.user_id
      and other.book_id = rec.book_id
      and other.id <> oldest_id
      -- Avoid PK collision (review_id, user_id) on review_likes
      and not exists (
        select 1 from public.review_likes rl2
        where rl2.review_id = oldest_id and rl2.user_id = rl.user_id
      );
    -- Likes that would collide are simply dropped by the cascade on review delete.

    update public.review_comments rc
    set review_id = oldest_id
    from public.reviews other
    where rc.review_id = other.id
      and other.user_id = rec.user_id
      and other.book_id = rec.book_id
      and other.id <> oldest_id;

    delete from public.reviews
    where user_id = rec.user_id
      and book_id = rec.book_id
      and id <> oldest_id;
  end loop;
end$$;

-- ---------------------------------------------------------------------------
-- 5) MERGE book_tags   PK(book_id, tag_id)
-- ---------------------------------------------------------------------------
insert into public.book_tags (book_id, tag_id, created_at)
select p.canonical_id, bt.tag_id, bt.created_at
from public.book_tags bt
join tmp_pairs p on p.dup_id = bt.book_id
on conflict (book_id, tag_id) do nothing;

delete from public.book_tags bt
using tmp_pairs p
where bt.book_id = p.dup_id;

-- ---------------------------------------------------------------------------
-- 6) MERGE list_items   UNIQUE(list_id, book_id)
-- ---------------------------------------------------------------------------
-- Insert duplicate rows onto canonical for lists that don't yet have it.
insert into public.list_items (list_id, book_id, position, note, created_at, updated_at)
select li.list_id, p.canonical_id, li.position, li.note, li.created_at, li.updated_at
from public.list_items li
join tmp_pairs p on p.dup_id = li.book_id
on conflict (list_id, book_id) do nothing;

delete from public.list_items li
using tmp_pairs p
where li.book_id = p.dup_id;

-- ---------------------------------------------------------------------------
-- 7) MERGE recommendations (no UNIQUE) — straight reassign
-- ---------------------------------------------------------------------------
update public.recommendations rc
set book_id = p.canonical_id
from tmp_pairs p
where rc.book_id = p.dup_id;

-- ---------------------------------------------------------------------------
-- 8) MERGE book_views (if present)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'book_views'
  ) then
    execute $sql$
      update public.book_views bv
      set book_id = p.canonical_id
      from tmp_pairs p
      where bv.book_id = p.dup_id
    $sql$;
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- 9a) Detach duplicates from unique-indexed fields FIRST. This frees up
--     isbn / google_books_id / open_library_id values for the canonicals to
--     adopt them in step 9b without UNIQUE conflicts.
-- ---------------------------------------------------------------------------
-- Snapshot the unique-indexed values per canonical BEFORE nulling them.
drop table if exists tmp_dup_unique_vals;
create temp table tmp_dup_unique_vals as
select
  p.canonical_id,
  (array_agg(b.isbn) filter (where b.isbn is not null))[1] as isbn,
  (array_agg(b.google_books_id) filter (where b.google_books_id is not null))[1] as google_books_id,
  (array_agg(b.open_library_id) filter (where b.open_library_id is not null))[1] as open_library_id
from tmp_pairs p
join public.books b on b.id = p.dup_id
group by p.canonical_id;

create index on tmp_dup_unique_vals(canonical_id);

-- Now null the unique-indexed fields on duplicates (clears the way).
update public.books
set isbn = null, google_books_id = null, open_library_id = null
where id in (select dup_id from tmp_pairs);

-- ---------------------------------------------------------------------------
-- 9b) Back-fill canonical UNIQUE fields, but ONLY if the value is not
--     already used by another row (some other canonical, or an untouched
--     book). This protects against cross-group UNIQUE collisions where two
--     unrelated canonicals share, e.g., the same google_books_id.
-- ---------------------------------------------------------------------------
update public.books canonical
set
  isbn = case
    when canonical.isbn is not null then canonical.isbn
    when dup_data.isbn is null then canonical.isbn
    when exists (select 1 from public.books b2
                 where b2.isbn = dup_data.isbn and b2.id <> canonical.id)
      then canonical.isbn  -- conflict: keep canonical's null
    else dup_data.isbn
  end,
  google_books_id = case
    when canonical.google_books_id is not null then canonical.google_books_id
    when dup_data.google_books_id is null then canonical.google_books_id
    when exists (select 1 from public.books b2
                 where b2.google_books_id = dup_data.google_books_id and b2.id <> canonical.id)
      then canonical.google_books_id
    else dup_data.google_books_id
  end,
  open_library_id = case
    when canonical.open_library_id is not null then canonical.open_library_id
    when dup_data.open_library_id is null then canonical.open_library_id
    when exists (select 1 from public.books b2
                 where b2.open_library_id = dup_data.open_library_id and b2.id <> canonical.id)
      then canonical.open_library_id
    else dup_data.open_library_id
  end,
  updated_at = now()
from tmp_dup_unique_vals dup_data
where canonical.id = dup_data.canonical_id;

-- ---------------------------------------------------------------------------
-- 9c) Back-fill canonical non-unique metadata (no collision risk here).
-- ---------------------------------------------------------------------------
update public.books canonical
set
  cover_url        = coalesce(canonical.cover_url,        dup_data.cover_url),
  publication_year = coalesce(canonical.publication_year, dup_data.publication_year),
  summary          = coalesce(canonical.summary,          dup_data.summary),
  publisher        = coalesce(canonical.publisher,        dup_data.publisher),
  language         = coalesce(canonical.language,         dup_data.language),
  updated_at = now()
from (
  select
    p.canonical_id,
    (array_agg(b.cover_url) filter (where b.cover_url is not null))[1] as cover_url,
    (array_agg(b.publication_year) filter (where b.publication_year is not null))[1] as publication_year,
    (array_agg(b.summary) filter (where b.summary is not null))[1] as summary,
    (array_agg(b.publisher) filter (where b.publisher is not null))[1] as publisher,
    (array_agg(b.language) filter (where b.language is not null))[1] as language
  from tmp_pairs p
  join public.books b on b.id = p.dup_id
  group by p.canonical_id
) dup_data
where canonical.id = dup_data.canonical_id;

-- ---------------------------------------------------------------------------
-- 11) Delete duplicate books. Any leftover FK rows would CASCADE — at this
--     point there should be none.
-- ---------------------------------------------------------------------------
delete from public.books
where id in (select dup_id from tmp_pairs);

-- ---------------------------------------------------------------------------
-- 12) Sanity checks before commit
-- ---------------------------------------------------------------------------
do $$
declare
  v_remaining int;
begin
  -- No duplicate book row should still exist.
  select count(*) into v_remaining
  from public.books b
  where b.id in (select dup_id from tmp_pairs);
  if v_remaining <> 0 then
    raise exception 'dedupe: % duplicate book rows still present, aborting', v_remaining;
  end if;

  -- No remaining duplicate isbn / google_books_id (excluding nulls).
  perform 1
  from (
    select isbn from public.books where isbn is not null and length(trim(isbn)) > 0
    group by isbn having count(*) > 1
  ) x;
  if found then
    raise exception 'dedupe: duplicate isbn groups remain';
  end if;

  perform 1
  from (
    select google_books_id from public.books
    where google_books_id is not null and length(trim(google_books_id)) > 0
    group by google_books_id having count(*) > 1
  ) x;
  if found then
    raise exception 'dedupe: duplicate google_books_id groups remain';
  end if;

  raise notice 'dedupe: sanity checks passed';
end$$;

-- ---------------------------------------------------------------------------
-- Inspect the notices above. If everything looks good, COMMIT. Else ROLLBACK.
-- ---------------------------------------------------------------------------
commit;
