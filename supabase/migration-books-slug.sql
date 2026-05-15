-- Add slug column for fast lookup by URL slug
-- Replaces the previous pattern: fetch up to 10000 books then JS .find()
-- Slug format mirrors generateBookSlug() in src/lib/slug.ts:
--   normalize(title) + "-par-" + normalize(author)
--   where normalize = lower + unaccent + non-alphanum -> "-" + trim "-"

create extension if not exists unaccent;

create or replace function public.book_normalize_segment(input text)
returns text
language sql
immutable
as $$
  select
    trim(both '-' from
      regexp_replace(
        lower(unaccent(coalesce(input, ''))),
        '[^a-z0-9]+',
        '-',
        'g'
      )
    );
$$;

create or replace function public.book_compute_slug(title text, author text)
returns text
language sql
immutable
as $$
  select
    public.book_normalize_segment(title)
    || '-par-'
    || public.book_normalize_segment(author);
$$;

alter table public.books
  add column if not exists slug text;

-- Trigger to keep slug in sync with title/author
create or replace function public.books_set_slug()
returns trigger
language plpgsql
as $$
begin
  new.slug := public.book_compute_slug(new.title, new.author);
  return new;
end;
$$;

drop trigger if exists trg_books_set_slug on public.books;
create trigger trg_books_set_slug
before insert or update of title, author on public.books
for each row
execute function public.books_set_slug();

-- Backfill existing rows
update public.books
set slug = public.book_compute_slug(title, author)
where slug is null or slug = '';

-- Index for fast lookup. Not unique because slug collisions are theoretically
-- possible (different titles/authors collapsing to identical normalized form);
-- the app must handle multiple matches if they ever occur.
create index if not exists books_slug_idx on public.books (slug);
