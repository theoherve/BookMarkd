-- ============================================================================
-- Migration: Feeling Keywords Feature
-- ----------------------------------------------------------------------------
-- Ajoute les tables pour les mots-clés de ressenti sur les livres
-- ============================================================================
-- Table des mots-clés prédéfinis (admin) ou proposés par les utilisateurs
create table if not exists public.feeling_keywords (
    id uuid primary key default uuid_generate_v4(),
    label text not null,
    slug text not null unique,
    source text not null default 'admin' check (source in ('admin', 'user')),
    created_by uuid references public.users(id) on delete
    set null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
);
-- Table de liaison entre utilisateurs, livres et mots-clés
create table if not exists public.user_book_feelings (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.users(id) on delete cascade,
    book_id uuid not null references public.books(id) on delete cascade,
    keyword_id uuid not null references public.feeling_keywords(id) on delete cascade,
    visibility text not null check (visibility in ('public', 'friends', 'private')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, book_id, keyword_id)
);
-- Indexes pour améliorer les performances
create index if not exists idx_feeling_keywords_slug on public.feeling_keywords (slug);
create index if not exists idx_user_book_feelings_user_book on public.user_book_feelings (user_id, book_id);
create index if not exists idx_user_book_feelings_book_keyword on public.user_book_feelings (book_id, keyword_id);
create index if not exists idx_user_book_feelings_visibility on public.user_book_feelings (book_id, visibility);
-- Activation RLS
alter table public.feeling_keywords enable row level security;
alter table public.user_book_feelings enable row level security;
-- Policies pour feeling_keywords
-- Lecture publique (tous les mots-clés sont visibles)
drop policy if exists "feeling_keywords_read_public" on public.feeling_keywords;
create policy "feeling_keywords_read_public" on public.feeling_keywords for
select using (true);
-- Insertion: n'importe quel utilisateur authentifié peut proposer un nouveau mot-clé
drop policy if exists "feeling_keywords_user_insert" on public.feeling_keywords;
create policy "feeling_keywords_user_insert" on public.feeling_keywords for
insert with check (auth.uid() is not null);
-- Update: seulement l'admin ou le créateur (pour l'instant, on permet au créateur)
drop policy if exists "feeling_keywords_owner_update" on public.feeling_keywords;
create policy "feeling_keywords_owner_update" on public.feeling_keywords for
update using (
        auth.uid() = created_by
        or source = 'admin'
    ) with check (
        auth.uid() = created_by
        or source = 'admin'
    );
-- Policies pour user_book_feelings
-- Lecture: selon la visibilité (même logique que reviews)
drop policy if exists "user_book_feelings_read" on public.user_book_feelings;
create policy "user_book_feelings_read" on public.user_book_feelings for
select using (
        visibility = 'public'
        or auth.uid() = user_id
        or (
            visibility = 'friends'
            and exists (
                select 1
                from public.follows f
                where f.follower_id = auth.uid()
                    and f.following_id = user_id
            )
        )
    );
-- Insertion: seulement le propriétaire
drop policy if exists "user_book_feelings_owner_insert" on public.user_book_feelings;
create policy "user_book_feelings_owner_insert" on public.user_book_feelings for
insert with check (auth.uid() = user_id);
-- Update: seulement le propriétaire
drop policy if exists "user_book_feelings_owner_update" on public.user_book_feelings;
create policy "user_book_feelings_owner_update" on public.user_book_feelings for
update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Delete: seulement le propriétaire
drop policy if exists "user_book_feelings_owner_delete" on public.user_book_feelings;
create policy "user_book_feelings_owner_delete" on public.user_book_feelings for delete using (auth.uid() = user_id);
-- Trigger pour mettre à jour updated_at automatiquement
create or replace function update_updated_at_column() returns trigger as $$ begin new.updated_at = now();
return new;
end;
$$ language plpgsql;
drop trigger if exists update_feeling_keywords_updated_at on public.feeling_keywords;
create trigger update_feeling_keywords_updated_at before
update on public.feeling_keywords for each row execute function update_updated_at_column();
drop trigger if exists update_user_book_feelings_updated_at on public.user_book_feelings;
create trigger update_user_book_feelings_updated_at before
update on public.user_book_feelings for each row execute function update_updated_at_column();