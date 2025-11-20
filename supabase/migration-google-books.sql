-- ============================================================================
-- BookMarkd – Migration Google Books API
-- ----------------------------------------------------------------------------
-- ⚠️ À exécuter dans l'éditeur SQL Supabase (schema public)
--     Cette migration ajoute le support de Google Books API
-- ============================================================================
-- 1) Ajouter les colonnes Google Books à la table books
ALTER TABLE public.books
ADD COLUMN IF NOT EXISTS google_books_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS isbn TEXT,
    ADD COLUMN IF NOT EXISTS publisher TEXT,
    ADD COLUMN IF NOT EXISTS language TEXT;
-- 2) Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_books_google_books_id ON public.books(google_books_id);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON public.books(isbn);
-- 3) Créer la table de tracking des quotas Google Books
CREATE TABLE IF NOT EXISTS public.google_books_quota (
    date DATE PRIMARY KEY,
    request_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- 4) Créer un index sur la date pour les requêtes de quota
CREATE INDEX IF NOT EXISTS idx_google_books_quota_date ON public.google_books_quota(date);
-- 5) Créer une fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_google_books_quota_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 6) Créer un trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS trigger_update_google_books_quota_updated_at ON public.google_books_quota;
CREATE TRIGGER trigger_update_google_books_quota_updated_at BEFORE
UPDATE ON public.google_books_quota FOR EACH ROW EXECUTE FUNCTION update_google_books_quota_updated_at();
-- 7) Optionnel: Nettoyer les anciennes entrées de quota (plus de 30 jours)
-- Cette fonction peut être appelée périodiquement via un cron job
CREATE OR REPLACE FUNCTION cleanup_old_google_books_quota() RETURNS INTEGER AS $$
DECLARE deleted_count INTEGER;
BEGIN
DELETE FROM public.google_books_quota
WHERE date < CURRENT_DATE - INTERVAL '30 days';
GET DIAGNOSTICS deleted_count = ROW_COUNT;
RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- Notes:
-- - La table google_books_quota stocke le nombre de requêtes par jour
-- - Le quota est limité à 950 requêtes/jour (marge de sécurité avant 1000)
-- - Les anciennes entrées (>30 jours) peuvent être nettoyées périodiquement
-- ============================================================================