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

alter table public.users
  enable row level security;

-- Demo data (password: bookmarkd123)
insert into public.users (id, email, display_name, password_hash, avatar_url, bio)
values (
  '7d9c7d7d-2fe3-4f7a-8dbe-6ae2f8dc6d3f',
  'camille@example.com',
  'Camille Bernard',
  '$2b$10$V.5BdiQl9owJjQ0B0jGiBOpywsOADHaQIrhzx8j8corlxdAOpsEdS',
  'https://i.pravatar.cc/150?img=47',
  'Rêveuse invétérée et dévoreuse de fantasy poétique.'
)
on conflict (email) do update
set
  display_name = excluded.display_name,
  password_hash = excluded.password_hash,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio,
  updated_at = now();

