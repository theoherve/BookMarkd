-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
-- Users table (simplified extrait de DB_SCHEMA.md)
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
alter table public.users enable row level security;
-- Demo data (password: bookmarkd123)
insert into public.users (
    id,
    email,
    display_name,
    password_hash,
    avatar_url,
    bio
  )
values (
    '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f',
    'camille@example.com',
    'Camille Bernard',
    '$2b$10$V.5BdiQl9owJjQ0B0jGiBOpywsOADHaQIrhzx8j8corlxdAOpsEdS',
    'https://i.pravatar.cc/150?img=47',
    'Rêveuse invétérée et dévoreuse de fantasy poétique.'
  ) on conflict (email) do
update
set display_name = excluded.display_name,
  password_hash = excluded.password_hash,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio,
  updated_at = now();
insert into public.users (
    id,
    email,
    display_name,
    password_hash,
    avatar_url,
    bio
  )
values (
    'c1f5c865-d7a5-4c3a-9bb1-9f1c668a9c22',
    'hugo@example.com',
    'Hugo Laurent',
    '$2b$10$V.5BdiQl9owJjQ0B0jGiBOpywsOADHaQIrhzx8j8corlxdAOpsEdS',
    'https://i.pravatar.cc/150?img=58',
    'Entre essais politiques et romans qui bousculent.'
  ) on conflict (email) do
update
set display_name = excluded.display_name,
  password_hash = excluded.password_hash,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio,
  updated_at = now();
-- Demo tags
insert into public.tags (id, name, slug)
values (
    '4bc3a8f4-128a-4cc3-9f7c-9c26f7d8ff31',
    'Fantasy',
    'fantasy'
  ),
  (
    '9d2525d2-6fdb-4a4f-905f-1d7e95e0b7c6',
    'Fiction',
    'fiction'
  ),
  (
    '32d62db5-61d1-4b65-b8d0-1da8f38c5013',
    'Historique',
    'historique'
  ),
  (
    '42bd1b68-fa7b-48bb-9f0f-55c70a15c11e',
    'Horreur',
    'horreur'
  ) on conflict (id) do
update
set name = excluded.name,
  slug = excluded.slug,
  created_at = now();
-- Demo books
insert into public.books (
    id,
    title,
    author,
    cover_url,
    publication_year,
    summary,
    average_rating,
    ratings_count,
    created_by
  )
values (
    'b0f68c32-521e-4a4d-8e77-7bcb80eb6f52',
    'Le Nom du vent',
    'Patrick Rothfuss',
    'https://images.unsplash.com/photo-1529651737248-dad5e287768e?auto=format&fit=crop&w=400&q=80',
    2007,
    'Kvothe raconte comment il est devenu l’archimage le plus redouté de son univers.',
    4.6,
    128,
    '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f'
  ),
  (
    'b4b079f0-0c80-4b8c-8aa3-c8d32956543a',
    'Pachinko',
    'Min Jin Lee',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=400&q=80',
    2017,
    'Saga familiale poignante d’une famille coréenne au Japon sur quatre générations.',
    4.4,
    96,
    'c1f5c865-d7a5-4c3a-9bb1-9f1c668a9c22'
  ),
  (
    'bfe5c9d9-2317-4db9-8a60-1b3e8aac4f7b',
    'Mexican Gothic',
    'Silvia Moreno-Garcia',
    'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=400&q=80',
    2020,
    'Une héritière glamour investigue un manoir inquiétant au cœur des montagnes mexicaines.',
    4.2,
    74,
    '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f'
  ) on conflict (id) do
update
set title = excluded.title,
  author = excluded.author,
  cover_url = excluded.cover_url,
  publication_year = excluded.publication_year,
  summary = excluded.summary,
  average_rating = excluded.average_rating,
  ratings_count = excluded.ratings_count,
  updated_at = now();
-- Book tags relations
insert into public.book_tags (book_id, tag_id)
values (
    'b0f68c32-521e-4a4d-8e77-7bcb80eb6f52',
    '4bc3a8f4-128a-4cc3-9f7c-9c26f7d8ff31'
  ),
  (
    'b0f68c32-521e-4a4d-8e77-7bcb80eb6f52',
    '9d2525d2-6fdb-4a4f-905f-1d7e95e0b7c6'
  ),
  (
    'b4b079f0-0c80-4b8c-8aa3-c8d32956543a',
    '32d62db5-61d1-4b65-b8d0-1da8f38c5013'
  ),
  (
    'b4b079f0-0c80-4b8c-8aa3-c8d32956543a',
    '9d2525d2-6fdb-4a4f-905f-1d7e95e0b7c6'
  ),
  (
    'bfe5c9d9-2317-4db9-8a60-1b3e8aac4f7b',
    '42bd1b68-fa7b-48bb-9f0f-55c70a15c11e'
  ) on conflict (book_id, tag_id) do nothing;
-- User books
insert into public.user_books (id, user_id, book_id, status, rating, rated_at)
values (
    '4fb4cd83-4141-4ba0-88ab-8d8f0a4cb49b',
    '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f',
    'b0f68c32-521e-4a4d-8e77-7bcb80eb6f52',
    'finished',
    5.0,
    now() - interval '2 hours'
  ),
  (
    'b79d97dd-26f9-4dac-a1b9-7b1eb369d7f9',
    'c1f5c865-d7a5-4c3a-9bb1-9f1c668a9c22',
    'b4b079f0-0c80-4b8c-8aa3-c8d32956543a',
    'reading',
    4.5,
    now() - interval '12 hours'
  ),
  (
    'd45a5930-11ab-4405-af9f-7d7ae0f8a04c',
    '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f',
    'bfe5c9d9-2317-4db9-8a60-1b3e8aac4f7b',
    'to_read',
    null,
    null
  ) on conflict (id) do
update
set status = excluded.status,
  rating = excluded.rating,
  rated_at = excluded.rated_at,
  updated_at = now();
-- Activities
insert into public.activities (id, user_id, type, payload, created_at)
values (
    'b4a69b84-1d23-4f46-8105-3edc97f40683',
    '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f',
    'rating',
    jsonb_build_object(
      'book_title',
      'Le Nom du vent',
      'rating',
      5,
      'note',
      'Un univers onirique parfait pour l’automne.'
    ),
    now() - interval '2 hours'
  ),
  (
    'f6ed97cd-1009-4a37-b3d7-ef7f1fcd7d14',
    'c1f5c865-d7a5-4c3a-9bb1-9f1c668a9c22',
    'review',
    jsonb_build_object(
      'book_title',
      'Pachinko',
      'review_snippet',
      'Un tourbillon d’émotions qui traverse les générations.'
    ),
    now() - interval '6 hours'
  ),
  (
    'f2baf1f5-2b3e-4c36-8e4d-66ebadc17709',
    '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f',
    'status_change',
    jsonb_build_object(
      'book_title',
      'Mexican Gothic',
      'status_note',
      'Ajouté à ma liste pour le club lecture d’Halloween.'
    ),
    now() - interval '1 day'
  ) on conflict (id) do
update
set payload = excluded.payload,
  created_at = excluded.created_at;
-- Recommendations
insert into public.recommendations (id, user_id, book_id, source, score, metadata)
values (
    'b82108d7-841d-4a87-82dd-6274957332aa',
    '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f',
    'bfe5c9d9-2317-4db9-8a60-1b3e8aac4f7b',
    'similar',
    92,
    jsonb_build_object(
      'reason',
      'Parce que vous avez aimé « Le Nom du vent ».'
    )
  ),
  (
    'a190ce73-29c7-4c19-9a79-2f4c92bb9666',
    '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f',
    'b4b079f0-0c80-4b8c-8aa3-c8d32956543a',
    'friends',
    88,
    jsonb_build_object('reason', 'Plébiscité par vos ami·e·s.')
  ),
  (
    'bc4a0a94-8072-473e-b650-579d6fbb2ada',
    '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f',
    'b0f68c32-521e-4a4d-8e77-7bcb80eb6f52',
    'global',
    84,
    jsonb_build_object(
      'reason',
      'Tendance dans les lectures BookMarkd cette semaine.'
    )
  ) on conflict (id) do
update
set score = excluded.score,
  metadata = excluded.metadata,
  created_at = excluded.created_at;