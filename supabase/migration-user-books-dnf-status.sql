-- Add 'dnf' (Did Not Finish) to user_books.status allowed values.
alter table public.user_books
  drop constraint if exists user_books_status_check;

alter table public.user_books
  add constraint user_books_status_check
  check (status in ('to_read', 'reading', 'finished', 'dnf'));
