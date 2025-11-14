-- Policies RLS pour la table users
-- À exécuter dans l'éditeur SQL Supabase après avoir exécuté schema.sql

-- Activer RLS sur la table users (si ce n'est pas déjà fait)
alter table public.users enable row level security;

-- Policy pour permettre l'insertion de nouveaux utilisateurs (inscription)
-- IMPORTANT: Cette policy permet à n'importe qui de créer un compte
-- Dans un environnement de production, vous pourriez vouloir restreindre cela
drop policy if exists "users_public_insert" on public.users;
create policy "users_public_insert" on public.users
  for insert
  with check (true);

-- Policy pour permettre la lecture publique des profils (pour l'affichage des noms, avatars, etc.)
drop policy if exists "users_public_read" on public.users;
create policy "users_public_read" on public.users
  for select
  using (true);

-- Policy pour permettre la mise à jour de son propre profil
drop policy if exists "users_own_update" on public.users;
create policy "users_own_update" on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

