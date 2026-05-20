-- ============================================================================
-- Migration: Site Modules toggles
-- ----------------------------------------------------------------------------
-- Permet à l'admin d'activer/désactiver des sections frontend sans redeploy.
-- Lecture publique RLS, écriture via service-role (Server Actions admin).
-- ============================================================================

create table if not exists public.site_modules (
  key text primary key,
  label text not null,
  description text,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists update_site_modules_updated_at on public.site_modules;
create trigger update_site_modules_updated_at before update
  on public.site_modules for each row
  execute function update_updated_at_column();

alter table public.site_modules enable row level security;

drop policy if exists "site_modules_public_read" on public.site_modules;
create policy "site_modules_public_read" on public.site_modules
  for select using (true);

-- Inserts/updates via service_role (bypass RLS automatiquement).

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed modules par défaut (ON par défaut, idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.site_modules (key, label, description, enabled) values
  ('home_feed_preview', 'Aperçu du fil',
   'Section "Aperçu du fil" sur la page d''accueil (activités, recommandations, tendances).', true),
  ('home_editorial', 'Tendances & Actu littéraire',
   'Section "Tendances & Actu littéraire" (sélections éditoriales) sur la page d''accueil.', true),
  ('home_public_lists', 'Listes de la communauté',
   'Section "Listes de la communauté" sur la page d''accueil.', true),
  ('home_blog_preview', 'Derniers articles du blog',
   'Section "Derniers articles du blog" sur la page d''accueil.', true)
on conflict (key) do nothing;
