-- ============================================================================
-- Migration: Feedback and Suggestions Feature
-- ----------------------------------------------------------------------------
-- Ajoute la table pour les feedbacks et suggestions des utilisateurs
-- ============================================================================
-- Table des feedbacks
create table if not exists public.feedbacks (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.users(id) on delete cascade,
    type text not null check (type in ('bug', 'suggestion')),
    title text not null,
    description text not null,
    browser_info jsonb,
    url text,
    status text not null default 'pending' check (
        status in ('pending', 'reviewed', 'resolved', 'rejected')
    ),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
-- Indexes pour améliorer les performances
create index if not exists idx_feedbacks_user_id on public.feedbacks (user_id);
create index if not exists idx_feedbacks_status on public.feedbacks (status);
create index if not exists idx_feedbacks_type on public.feedbacks (type);
create index if not exists idx_feedbacks_created_at on public.feedbacks (created_at desc);
-- Activation RLS
alter table public.feedbacks enable row level security;
-- Policies pour feedbacks
-- Lecture: utilisateur peut voir ses propres feedbacks
drop policy if exists "feedbacks_user_read" on public.feedbacks;
create policy "feedbacks_user_read" on public.feedbacks for
select using (auth.uid() = user_id);
-- Insertion: utilisateur authentifié peut créer un feedback
drop policy if exists "feedbacks_user_insert" on public.feedbacks;
create policy "feedbacks_user_insert" on public.feedbacks for
insert with check (auth.uid() = user_id);
-- Update: seulement le créateur peut mettre à jour ses propres feedbacks
drop policy if exists "feedbacks_user_update" on public.feedbacks;
create policy "feedbacks_user_update" on public.feedbacks for
update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Delete: seulement le créateur peut supprimer ses propres feedbacks
drop policy if exists "feedbacks_user_delete" on public.feedbacks;
create policy "feedbacks_user_delete" on public.feedbacks for delete using (auth.uid() = user_id);
-- Trigger pour mettre à jour updated_at automatiquement
create or replace function update_feedbacks_updated_at() returns trigger as $$ begin new.updated_at = now();
return new;
end;
$$ language plpgsql;
drop trigger if exists update_feedbacks_updated_at on public.feedbacks;
create trigger update_feedbacks_updated_at before
update on public.feedbacks for each row execute function update_feedbacks_updated_at();