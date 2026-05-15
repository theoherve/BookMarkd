-- ============================================================================
-- DEDUPE BOOKS — DRY RUN (read-only)
-- ----------------------------------------------------------------------------
-- Lists duplicate groups, the elected canonical book per group, and the
-- number of related rows that would be reassigned by the migration.
--
-- Duplicate detection cascade (a single book id can belong to only one group):
--   1. isbn match            (when isbn is not null/empty)
--   2. google_books_id match (when google_books_id is not null/empty)
--   3. slug match            (when slug is not null/empty)
--
-- Canonical election per group:
--   max(refs_total) DESC, created_at ASC, id ASC
--   refs_total = user_books + reviews + book_tags + list_items
--              + recommendations + book_views
--
-- ⚠️ Supabase SQL Editor "Run" sometimes splits multi-statement scripts in
--    inconsistent ways. To stay portable, each REPORT below is a single,
--    self-contained SELECT (CTEs recompute the groups + canonical from
--    scratch). Slower but bullet-proof.
--
-- USAGE in Supabase SQL Editor:
--   - Select ONE report block (REPORT 1, REPORT 2, ...) and click Run.
--   - Repeat for each report you want to inspect.
--   - No setup, no cleanup, nothing to drop. Pure SELECT.
-- ============================================================================


-- ============================================================================
-- REPORT 1 — Summary (run this first)
-- ============================================================================
with
  refs as (
    select
      b.id as book_id,
      coalesce((select count(*) from public.user_books ub where ub.book_id = b.id), 0)
      + coalesce((select count(*) from public.reviews r where r.book_id = b.id), 0)
      + coalesce((select count(*) from public.book_tags bt where bt.book_id = b.id), 0)
      + coalesce((select count(*) from public.list_items li where li.book_id = b.id), 0)
      + coalesce((select count(*) from public.recommendations rc where rc.book_id = b.id), 0)
      as refs_total
    from public.books b
  ),
  by_isbn as (
    select b.id as book_id, 'isbn:' || lower(trim(b.isbn)) as group_key, 'isbn'::text as match_type
    from public.books b
    where b.isbn is not null and length(trim(b.isbn)) > 0
  ),
  isbn_groups as (select group_key from by_isbn group by group_key having count(*) > 1),
  isbn_assigned as (select b.book_id, b.group_key, b.match_type from by_isbn b join isbn_groups g using(group_key)),
  by_gbid as (
    select b.id as book_id, 'gbid:' || b.google_books_id as group_key, 'google_books_id'::text as match_type
    from public.books b
    where b.google_books_id is not null and length(trim(b.google_books_id)) > 0
      and b.id not in (select book_id from isbn_assigned)
  ),
  gbid_groups as (select group_key from by_gbid group by group_key having count(*) > 1),
  gbid_assigned as (select b.book_id, b.group_key, b.match_type from by_gbid b join gbid_groups g using(group_key)),
  by_slug as (
    select b.id as book_id, 'slug:' || b.slug as group_key, 'slug'::text as match_type
    from public.books b
    where b.slug is not null and length(trim(b.slug)) > 0
      and b.id not in (select book_id from isbn_assigned)
      and b.id not in (select book_id from gbid_assigned)
  ),
  slug_groups as (select group_key from by_slug group by group_key having count(*) > 1),
  slug_assigned as (select b.book_id, b.group_key, b.match_type from by_slug b join slug_groups g using(group_key)),
  groups as (
    select * from isbn_assigned
    union all select * from gbid_assigned
    union all select * from slug_assigned
  ),
  canonical as (
    select distinct on (g.group_key)
      g.group_key, g.match_type, b.id as canonical_id
    from groups g
    join public.books b on b.id = g.book_id
    join refs r on r.book_id = g.book_id
    order by g.group_key, r.refs_total desc, b.created_at asc, b.id asc
  ),
  rows as (
    select 1 as ord, '=== SUMMARY ===' as section, null::text as detail, null::bigint as value
    union all select 2, 'groups_total', null, count(*)::bigint from canonical
    union all select 3, 'duplicates_to_delete', null,
      (select count(*) from groups) - (select count(*) from canonical)
    union all select 4, 'books_affected_total', null, count(*)::bigint from groups
    union all select 5, 'by_match_type', match_type, count(*)::bigint
      from canonical group by match_type
  )
select section, detail, value from rows order by ord, detail nulls first;


-- ============================================================================
-- REPORT 2 — Per-group detail (canonical + each duplicate, with ref counts)
-- ============================================================================
with
  refs as (
    select
      b.id as book_id,
      coalesce((select count(*) from public.user_books ub where ub.book_id = b.id), 0) as n_user_books,
      coalesce((select count(*) from public.reviews r where r.book_id = b.id), 0) as n_reviews,
      coalesce((select count(*) from public.book_tags bt where bt.book_id = b.id), 0) as n_book_tags,
      coalesce((select count(*) from public.list_items li where li.book_id = b.id), 0) as n_list_items,
      coalesce((select count(*) from public.recommendations rc where rc.book_id = b.id), 0) as n_recommendations
    from public.books b
  ),
  refs_total as (
    select book_id, (n_user_books + n_reviews + n_book_tags + n_list_items + n_recommendations) as refs_total,
           n_user_books, n_reviews, n_book_tags, n_list_items, n_recommendations
    from refs
  ),
  by_isbn as (
    select b.id as book_id, 'isbn:' || lower(trim(b.isbn)) as group_key, 'isbn'::text as match_type
    from public.books b where b.isbn is not null and length(trim(b.isbn)) > 0
  ),
  isbn_groups as (select group_key from by_isbn group by group_key having count(*) > 1),
  isbn_assigned as (select b.book_id, b.group_key, b.match_type from by_isbn b join isbn_groups g using(group_key)),
  by_gbid as (
    select b.id as book_id, 'gbid:' || b.google_books_id as group_key, 'google_books_id'::text as match_type
    from public.books b
    where b.google_books_id is not null and length(trim(b.google_books_id)) > 0
      and b.id not in (select book_id from isbn_assigned)
  ),
  gbid_groups as (select group_key from by_gbid group by group_key having count(*) > 1),
  gbid_assigned as (select b.book_id, b.group_key, b.match_type from by_gbid b join gbid_groups g using(group_key)),
  by_slug as (
    select b.id as book_id, 'slug:' || b.slug as group_key, 'slug'::text as match_type
    from public.books b
    where b.slug is not null and length(trim(b.slug)) > 0
      and b.id not in (select book_id from isbn_assigned)
      and b.id not in (select book_id from gbid_assigned)
  ),
  slug_groups as (select group_key from by_slug group by group_key having count(*) > 1),
  slug_assigned as (select b.book_id, b.group_key, b.match_type from by_slug b join slug_groups g using(group_key)),
  groups as (
    select * from isbn_assigned union all
    select * from gbid_assigned union all
    select * from slug_assigned
  ),
  canonical as (
    select distinct on (g.group_key)
      g.group_key, g.match_type, b.id as canonical_id
    from groups g
    join public.books b on b.id = g.book_id
    join refs_total r on r.book_id = g.book_id
    order by g.group_key, r.refs_total desc, b.created_at asc, b.id asc
  )
select
  c.group_key,
  c.match_type,
  case when b.id = c.canonical_id then 'CANONICAL' else 'duplicate' end as role,
  b.id as book_id,
  b.title,
  b.author,
  b.isbn,
  b.google_books_id,
  b.slug,
  b.created_at,
  r.n_user_books,
  r.n_reviews,
  r.n_book_tags,
  r.n_list_items,
  r.n_recommendations,
  r.refs_total
from groups g
join canonical c on c.group_key = g.group_key
join public.books b on b.id = g.book_id
join refs_total r on r.book_id = g.book_id
order by c.group_key, (b.id = c.canonical_id) desc, r.refs_total desc, b.created_at asc;


-- ============================================================================
-- REPORT 3 — Rows to be reassigned by table
-- ============================================================================
with
  refs as (
    select
      b.id as book_id,
      coalesce((select count(*) from public.user_books ub where ub.book_id = b.id), 0)
      + coalesce((select count(*) from public.reviews r where r.book_id = b.id), 0)
      + coalesce((select count(*) from public.book_tags bt where bt.book_id = b.id), 0)
      + coalesce((select count(*) from public.list_items li where li.book_id = b.id), 0)
      + coalesce((select count(*) from public.recommendations rc where rc.book_id = b.id), 0)
      as refs_total
    from public.books b
  ),
  by_isbn as (
    select b.id as book_id, 'isbn:' || lower(trim(b.isbn)) as group_key
    from public.books b where b.isbn is not null and length(trim(b.isbn)) > 0
  ),
  isbn_groups as (select group_key from by_isbn group by group_key having count(*) > 1),
  isbn_assigned as (select b.book_id, b.group_key from by_isbn b join isbn_groups g using(group_key)),
  by_gbid as (
    select b.id as book_id, 'gbid:' || b.google_books_id as group_key
    from public.books b
    where b.google_books_id is not null and length(trim(b.google_books_id)) > 0
      and b.id not in (select book_id from isbn_assigned)
  ),
  gbid_groups as (select group_key from by_gbid group by group_key having count(*) > 1),
  gbid_assigned as (select b.book_id, b.group_key from by_gbid b join gbid_groups g using(group_key)),
  by_slug as (
    select b.id as book_id, 'slug:' || b.slug as group_key
    from public.books b
    where b.slug is not null and length(trim(b.slug)) > 0
      and b.id not in (select book_id from isbn_assigned)
      and b.id not in (select book_id from gbid_assigned)
  ),
  slug_groups as (select group_key from by_slug group by group_key having count(*) > 1),
  slug_assigned as (select b.book_id, b.group_key from by_slug b join slug_groups g using(group_key)),
  groups as (
    select * from isbn_assigned union all
    select * from gbid_assigned union all
    select * from slug_assigned
  ),
  canonical as (
    select distinct on (g.group_key) g.group_key, b.id as canonical_id
    from groups g
    join public.books b on b.id = g.book_id
    join refs r on r.book_id = g.book_id
    order by g.group_key, r.refs_total desc, b.created_at asc, b.id asc
  ),
  dup_ids as (
    select g.book_id from groups g
    join canonical c on c.group_key = g.group_key
    where g.book_id <> c.canonical_id
  )
select 'user_books' as table_name, count(*)::bigint as rows_to_reassign
from public.user_books where book_id in (select book_id from dup_ids)
union all
select 'reviews', count(*)::bigint from public.reviews where book_id in (select book_id from dup_ids)
union all
select 'book_tags', count(*)::bigint from public.book_tags where book_id in (select book_id from dup_ids)
union all
select 'list_items', count(*)::bigint from public.list_items where book_id in (select book_id from dup_ids)
union all
select 'recommendations', count(*)::bigint from public.recommendations where book_id in (select book_id from dup_ids);


-- ============================================================================
-- REPORT 4 — user_books conflicts
-- (same user has rows on multiple books in the same dedup group)
-- ============================================================================
with
  refs as (
    select
      b.id as book_id,
      coalesce((select count(*) from public.user_books ub where ub.book_id = b.id), 0)
      + coalesce((select count(*) from public.reviews r where r.book_id = b.id), 0)
      + coalesce((select count(*) from public.book_tags bt where bt.book_id = b.id), 0)
      + coalesce((select count(*) from public.list_items li where li.book_id = b.id), 0)
      + coalesce((select count(*) from public.recommendations rc where rc.book_id = b.id), 0)
      as refs_total
    from public.books b
  ),
  by_isbn as (
    select b.id as book_id, 'isbn:' || lower(trim(b.isbn)) as group_key
    from public.books b where b.isbn is not null and length(trim(b.isbn)) > 0
  ),
  isbn_groups as (select group_key from by_isbn group by group_key having count(*) > 1),
  isbn_assigned as (select b.book_id, b.group_key from by_isbn b join isbn_groups g using(group_key)),
  by_gbid as (
    select b.id as book_id, 'gbid:' || b.google_books_id as group_key
    from public.books b
    where b.google_books_id is not null and length(trim(b.google_books_id)) > 0
      and b.id not in (select book_id from isbn_assigned)
  ),
  gbid_groups as (select group_key from by_gbid group by group_key having count(*) > 1),
  gbid_assigned as (select b.book_id, b.group_key from by_gbid b join gbid_groups g using(group_key)),
  by_slug as (
    select b.id as book_id, 'slug:' || b.slug as group_key
    from public.books b
    where b.slug is not null and length(trim(b.slug)) > 0
      and b.id not in (select book_id from isbn_assigned)
      and b.id not in (select book_id from gbid_assigned)
  ),
  slug_groups as (select group_key from by_slug group by group_key having count(*) > 1),
  slug_assigned as (select b.book_id, b.group_key from by_slug b join slug_groups g using(group_key)),
  groups as (
    select * from isbn_assigned union all
    select * from gbid_assigned union all
    select * from slug_assigned
  ),
  canonical as (
    select distinct on (g.group_key) g.group_key
    from groups g
    join public.books b on b.id = g.book_id
    join refs r on r.book_id = g.book_id
    order by g.group_key, r.refs_total desc, b.created_at asc, b.id asc
  )
select
  c.group_key,
  ub.user_id,
  count(*) as rows_for_user_in_group,
  string_agg(ub.status || ' (' || ub.book_id || ')', ', ' order by ub.updated_at desc) as statuses
from public.user_books ub
join groups g on g.book_id = ub.book_id
join canonical c on c.group_key = g.group_key
group by c.group_key, ub.user_id
having count(*) > 1
order by c.group_key, ub.user_id;


-- ============================================================================
-- REPORT 5 — review conflicts
-- (same user has multiple reviews on duplicate books in the same group)
-- ============================================================================
with
  refs as (
    select
      b.id as book_id,
      coalesce((select count(*) from public.user_books ub where ub.book_id = b.id), 0)
      + coalesce((select count(*) from public.reviews r where r.book_id = b.id), 0)
      + coalesce((select count(*) from public.book_tags bt where bt.book_id = b.id), 0)
      + coalesce((select count(*) from public.list_items li where li.book_id = b.id), 0)
      + coalesce((select count(*) from public.recommendations rc where rc.book_id = b.id), 0)
      as refs_total
    from public.books b
  ),
  by_isbn as (
    select b.id as book_id, 'isbn:' || lower(trim(b.isbn)) as group_key
    from public.books b where b.isbn is not null and length(trim(b.isbn)) > 0
  ),
  isbn_groups as (select group_key from by_isbn group by group_key having count(*) > 1),
  isbn_assigned as (select b.book_id, b.group_key from by_isbn b join isbn_groups g using(group_key)),
  by_gbid as (
    select b.id as book_id, 'gbid:' || b.google_books_id as group_key
    from public.books b
    where b.google_books_id is not null and length(trim(b.google_books_id)) > 0
      and b.id not in (select book_id from isbn_assigned)
  ),
  gbid_groups as (select group_key from by_gbid group by group_key having count(*) > 1),
  gbid_assigned as (select b.book_id, b.group_key from by_gbid b join gbid_groups g using(group_key)),
  by_slug as (
    select b.id as book_id, 'slug:' || b.slug as group_key
    from public.books b
    where b.slug is not null and length(trim(b.slug)) > 0
      and b.id not in (select book_id from isbn_assigned)
      and b.id not in (select book_id from gbid_assigned)
  ),
  slug_groups as (select group_key from by_slug group by group_key having count(*) > 1),
  slug_assigned as (select b.book_id, b.group_key from by_slug b join slug_groups g using(group_key)),
  groups as (
    select * from isbn_assigned union all
    select * from gbid_assigned union all
    select * from slug_assigned
  ),
  canonical as (
    select distinct on (g.group_key) g.group_key
    from groups g
    join public.books b on b.id = g.book_id
    join refs r on r.book_id = g.book_id
    order by g.group_key, r.refs_total desc, b.created_at asc, b.id asc
  )
select
  c.group_key,
  rv.user_id,
  count(*) as reviews_for_user_in_group,
  string_agg('[' || rv.id || ' on ' || rv.book_id || ' ' || length(rv.content) || 'ch]', ', '
             order by rv.created_at asc) as reviews
from public.reviews rv
join groups g on g.book_id = rv.book_id
join canonical c on c.group_key = g.group_key
group by c.group_key, rv.user_id
having count(*) > 1
order by c.group_key, rv.user_id;
