-- ============================================================================
-- BookMarkd – Migration RLS (Security Advisor)
-- ----------------------------------------------------------------------------
-- Corrige les alertes "RLS Disabled in Public" pour :
--   - public.google_books_quota
--   - public._prisma_migrations
--
-- Ces tables restent accessibles côté serveur (service_role bypass RLS) et
-- pour Prisma Migrate (connexion directe en tant qu’owner). Aucune policy
-- n’est créée pour anon/authenticated, donc l’API PostgREST ne les expose pas.
-- ============================================================================

-- 1) google_books_quota : utilisée uniquement côté serveur (quota Google Books)
ALTER TABLE public.google_books_quota ENABLE ROW LEVEL SECURITY;

-- Aucune policy : seul le service_role (serveur Next.js) peut accéder à la table.
-- Les rôles anon/authenticated n’ont aucun accès via l’API.

-- 2) _prisma_migrations : table interne Prisma (historique des migrations)
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;

-- Aucune policy : seuls le propriétaire de la table (connexion directe / Prisma migrate)
-- et le service_role peuvent y accéder. L’API publique ne doit pas l’exposer.
