-- Migration: add featured_books column to blog_posts
-- Stores UUIDs of books featured in the article — used to render book covers
-- as the article hero image on the blog preview / list.
-- Order in the array is preserved (first book = primary cover).

alter table public.blog_posts
  add column if not exists featured_books uuid[] not null default '{}'::uuid[];

create index if not exists idx_blog_posts_featured_books
  on public.blog_posts using gin (featured_books);
