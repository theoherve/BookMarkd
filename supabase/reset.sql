-- ============================================================================
-- BookMarkd – Script de réinitialisation de la base de données
-- ----------------------------------------------------------------------------
-- ⚠️ À exécuter dans l'éditeur SQL Supabase
-- Ce script supprime toutes les données et réinitialise la base avec le schéma et les données de démo
-- ============================================================================

-- 1) Supprimer toutes les données (dans l'ordre pour respecter les contraintes FK)
-- ============================================================================

-- Désactiver temporairement les contraintes de clés étrangères pour faciliter la suppression
SET session_replication_role = 'replica';

-- Supprimer les données dans l'ordre inverse des dépendances
DELETE FROM public.review_comments;
DELETE FROM public.review_likes;
DELETE FROM public.reviews;
DELETE FROM public.recommendations;
DELETE FROM public.activities;
DELETE FROM public.list_items;
DELETE FROM public.list_collaborators;
DELETE FROM public.lists;
DELETE FROM public.follows;
DELETE FROM public.user_books;
DELETE FROM public.book_tags;
DELETE FROM public.books;
DELETE FROM public.tags;
DELETE FROM public.users;

-- Réactiver les contraintes
SET session_replication_role = 'origin';

-- 2) Réappliquer le schéma (si nécessaire)
-- ============================================================================
-- Note: Le schéma devrait déjà exister, mais on peut le recréer si besoin
-- Voir supabase/schema.sql pour le schéma complet

-- 3) Réinsérer les données de démonstration
-- ============================================================================
-- Voir supabase/seed.sql pour les données complètes

-- Users
INSERT INTO public.users (
  id,
  email,
  display_name,
  password_hash,
  avatar_url,
  bio
)
VALUES (
  '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f',
  'camille@example.com',
  'Camille Bernard',
  '$2b$10$V.5BdiQl9owJjQ0B0jGiBOpywsOADHaQIrhzx8j8corlxdAOpsEdS',
  'https://i.pravatar.cc/150?img=47',
  'Rêveuse invétérée et dévoreuse de fantasy poétique.'
),
(
  'c1f5c865-d7a5-4c3a-9bb1-9f1c668a9c22',
  'hugo@example.com',
  'Hugo Laurent',
  '$2b$10$V.5BdiQl9owJjQ0B0jGiBOpywsOADHaQIrhzx8j8corlxdAOpsEdS',
  'https://i.pravatar.cc/150?img=58',
  'Entre essais politiques et romans qui bousculent.'
);

-- Tags
INSERT INTO public.tags (id, name, slug)
VALUES (
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
);

-- Books
INSERT INTO public.books (
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
VALUES (
  'b0f68c32-521e-4a4d-8e77-7bcb80eb6f52',
  'Le Nom du vent',
  'Patrick Rothfuss',
  'https://images.unsplash.com/photo-1529651737248-dad5e287768e?auto=format&fit=crop&w=400&q=80',
  2007,
  'Kvothe raconte comment il est devenu l''archimage le plus redouté de son univers.',
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
  'Saga familiale poignante d''une famille coréenne au Japon sur quatre générations.',
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
  'Jacob et les enfants particuliers partent en mission à travers l''Amérique des années 40.',
  4.1,
  65,
  'c1f5c865-d7a5-4c3a-9bb1-9f1c668a9c22'
);

-- Book tags
INSERT INTO public.book_tags (book_id, tag_id)
VALUES (
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
);

-- User books
INSERT INTO public.user_books (id, user_id, book_id, status, rating, rated_at)
VALUES (
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
);

-- Lists
INSERT INTO public.lists (
  id,
  owner_id,
  title,
  description,
  visibility,
  is_collaborative
)
VALUES (
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
);

-- List collaborators
INSERT INTO public.list_collaborators (list_id, user_id, role)
VALUES (
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
);

-- List items
INSERT INTO public.list_items (id, list_id, book_id, position, note)
VALUES (
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
);

-- Reviews
INSERT INTO public.reviews (
  id,
  user_id,
  book_id,
  visibility,
  title,
  content,
  spoiler
)
VALUES (
  'c0a1cf34-7f40-4f63-9c73-2c676f10c5ce',
  '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f',
  'b0f68c32-521e-4a4d-8e77-7bcb80eb6f52',
  'public',
  'Un conte lumineux',
  'Ce roman m''a replongé dans l''émerveillement des contes avec une profondeur inattendue.',
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
);

-- Review comments
INSERT INTO public.review_comments (id, review_id, user_id, content)
VALUES (
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
);

-- Activities
INSERT INTO public.activities (id, user_id, type, payload, created_at)
VALUES (
  'b4a69b84-1d23-4f46-8105-3edc97f40683',
  '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f',
  'rating',
  jsonb_build_object(
    'book_title',
    'Le Nom du vent',
    'rating',
    5,
    'note',
    'Un univers onirique parfait pour l''automne.'
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
    'Un tourbillon d''émotions qui traverse les générations.'
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
    'Ajouté à ma liste pour le club lecture d''Halloween.'
  ),
  now() - interval '1 day'
);

-- Recommendations
INSERT INTO public.recommendations (id, user_id, book_id, source, score, metadata)
VALUES (
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
);

-- Follows
INSERT INTO public.follows (follower_id, following_id)
VALUES (
  '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f',
  'c1f5c865-d7a5-4c3a-9bb1-9f1c668a9c22'
),
(
  'c1f5c865-d7a5-4c3a-9bb1-9f1c668a9c22',
  '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f'
);

-- ============================================================================
-- Réinitialisation terminée
-- ============================================================================

