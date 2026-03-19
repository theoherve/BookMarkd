-- Migration: Editorial lists — passage aux tendances semestrielles
-- 1. Table de staging pour les classements hebdomadaires bruts
-- 2. Nouvelles colonnes sur editorial_lists (période)
-- 3. Nouvelles colonnes sur editorial_list_books (agrégation)
-- 4. Archivage des anciennes listes hebdomadaires

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Table staging : classements hebdomadaires bruts NY Times
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS nytimes_weekly_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_name text NOT NULL,          -- 'hardcover-fiction' ou 'hardcover-nonfiction'
  week_date date NOT NULL,          -- date du classement NYT (bestsellers_date)
  isbn13 text NOT NULL,
  title text NOT NULL,
  author text NOT NULL,
  description text,
  cover_url text,
  rank integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(list_name, week_date, isbn13)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. Nouvelles colonnes sur editorial_lists
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE editorial_lists
  ADD COLUMN IF NOT EXISTS period_type text DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS semester_label text,
  ADD COLUMN IF NOT EXISTS period_start date,
  ADD COLUMN IF NOT EXISTS period_end date;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Nouvelles colonnes sur editorial_list_books (stats d'agrégation)
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE editorial_list_books
  ADD COLUMN IF NOT EXISTS appearances integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS avg_rank numeric(5,2),
  ADD COLUMN IF NOT EXISTS best_rank integer,
  ADD COLUMN IF NOT EXISTS aggregate_score numeric(8,2);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. Archiver les anciennes listes hebdomadaires NY Times
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE editorial_lists
SET status = 'archived'
WHERE source = 'nytimes'
  AND (period_type IS NULL OR period_type = 'weekly')
  AND status != 'archived';
