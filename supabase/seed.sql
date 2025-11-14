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
  ),
  (
    'c2a16dc6-0f8e-4c6a-9f29-6a96856c5af3',
    'La Carte des jours',
    'Ransom Riggs',
    'https://images.unsplash.com/photo-1473862170180-61d3e1f6f5a3?auto=format&fit=crop&w=400&q=80',
    2018,
    'Jacob et les enfants particuliers partent en mission à travers l’Amérique des années 40.',
    4.1,
    65,
    'c1f5c865-d7a5-4c3a-9bb1-9f1c668a9c22'
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
  ),
  (
    'c2a16dc6-0f8e-4c6a-9f29-6a96856c5af3',
    '9d2525d2-6fdb-4a4f-905f-1d7e95e0b7c6'
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
-- Lists & collaborations
insert into public.lists (
    id,
    owner_id,
    title,
    description,
    visibility,
    is_collaborative
  )
values (
    'a2d4fb57-8ab1-4223-8a8a-33d8a1497772',
    '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f',
    'Club lecture automne',
    'Sélection cosy pour la saison.',
    'unlisted',
    true
  ),
  (
    'b3c0f5b4-5a6d-4a39-8bbd-5dd6980a3f9d',
    'c1f5c865-d7a5-4c3a-9bb1-9f1c668a9c22',
    'Lectures engagées',
    'Romans et essais pour nourrir les débats.',
    'public',
    true
  ) on conflict (id) do
update
set title = excluded.title,
  description = excluded.description,
  visibility = excluded.visibility,
  is_collaborative = excluded.is_collaborative,
  updated_at = now();
insert into public.list_collaborators (list_id, user_id, role)
values (
    'a2d4fb57-8ab1-4223-8a8a-33d8a1497772',
    'c1f5c865-d7a5-4c3a-9bb1-9f1c668a9c22',
    'editor'
  ),
  (
    'b3c0f5b4-5a6d-4a39-8bbd-5dd6980a3f9d',
    '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f',
    'editor'
  ),
  (
    'b3c0f5b4-5a6d-4a39-8bbd-5dd6980a3f9d',
    'c1f5c865-d7a5-4c3a-9bb1-9f1c668a9c22',
    'viewer'
  ) on conflict (list_id, user_id) do
update
set role = excluded.role;
insert into public.list_items (id, list_id, book_id, position, note)
values (
    'c8905996-92cf-44a7-81f0-4a354d0fe4df',
    'a2d4fb57-8ab1-4223-8a8a-33d8a1497772',
    'bfe5c9d9-2317-4db9-8a60-1b3e8aac4f7b',
    1,
    'Parfait pour Halloween.'
  ),
  (
    'd4f3536c-5cc9-48a9-8a9a-3c7d8e43f1ae',
    'a2d4fb57-8ab1-4223-8a8a-33d8a1497772',
    'b0f68c32-521e-4a4d-8e77-7bcb80eb6f52',
    2,
    null
  ),
  (
    'c3b39dd4-5406-4fcd-9a65-52db8c5f22b1',
    'b3c0f5b4-5a6d-4a39-8bbd-5dd6980a3f9d',
    'b4b079f0-0c80-4b8c-8aa3-c8d32956543a',
    1,
    'Pour lancer la discussion sur les migrations.'
  ),
  (
    'b89b6f07-5d9b-4f2f-855d-9f4c3c9d45b1',
    'b3c0f5b4-5a6d-4a39-8bbd-5dd6980a3f9d',
    'c2a16dc6-0f8e-4c6a-9f29-6a96856c5af3',
    2,
    'Suite parfaite pour explorer la résistance.'
  ) on conflict (id) do
update
set position = excluded.position,
  note = excluded.note,
  updated_at = now();
-- Reviews & comments
insert into public.reviews (
    id,
    user_id,
    book_id,
    visibility,
    title,
    content,
    spoiler
  )
values (
    'c0a1cf34-7f40-4f63-9c73-2c676f10c5ce',
    '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f',
    'b0f68c32-521e-4a4d-8e77-7bcb80eb6f52',
    'public',
    'Un conte lumineux',
    'Ce roman m’a replongé dans l’émerveillement des contes avec une profondeur inattendue.',
    false
  ),
  (
    'd0e4a97c-7b12-47e0-b845-46448f9c42e4',
    'c1f5c865-d7a5-4c3a-9bb1-9f1c668a9c22',
    'b4b079f0-0c80-4b8c-8aa3-c8d32956543a',
    'public',
    'Chronique bouleversante',
    'Chaque chapitre est une claque émotionnelle. Lecture essentielle.',
    false
  ) on conflict (id) do
update
set title = excluded.title,
  content = excluded.content,
  visibility = excluded.visibility,
  spoiler = excluded.spoiler,
  updated_at = now();
insert into public.review_comments (id, review_id, user_id, content)
values (
    'f125a1d8-00a1-4bf1-a5f1-113a0c33233c',
    'c0a1cf34-7f40-4f63-9c73-2c676f10c5ce',
    'c1f5c865-d7a5-4c3a-9bb1-9f1c668a9c22',
    'Merci pour la reco ! Je le mets dans ma pile à lire.'
  ),
  (
    'e25c6504-1f6d-4420-90ff-50ac062e2f21',
    'd0e4a97c-7b12-47e0-b845-46448f9c42e4',
    '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f',
    'Ton avis me donne envie de le relire immédiatement.'
  ) on conflict (id) do
update
set content = excluded.content,
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
-- Follows
insert into public.follows (follower_id, following_id)
values (
    '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f',
    'c1f5c865-d7a5-4c3a-9bb1-9f1c668a9c22'
  ),
  (
    'c1f5c865-d7a5-4c3a-9bb1-9f1c668a9c22',
    '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f'
  ) on conflict (follower_id, following_id) do nothing;