-- Migration: Ajouter le champ is_admin à la table users
-- À exécuter dans l'éditeur SQL Supabase

-- Ajouter la colonne is_admin si elle n'existe pas déjà
alter table public.users
add column if not exists is_admin boolean not null default false;

-- Créer un index pour améliorer les performances des requêtes de vérification admin
create index if not exists idx_users_is_admin on public.users(is_admin) where is_admin = true;

-- Commentaire pour documenter la colonne
comment on column public.users.is_admin is 'Indique si l''utilisateur a les droits administrateur';
