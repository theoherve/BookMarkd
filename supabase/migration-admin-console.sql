-- ============================================================================
-- BookMarkd - Migration: Admin Console
-- ----------------------------------------------------------------------------
-- Ajoute les tables necessaires pour la console d'administration
-- ============================================================================
-- 1) Table page_views: tracking des vues de pages
CREATE TABLE IF NOT EXISTS public.page_views (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    path text NOT NULL,
    referrer text,
    user_agent text,
    user_id uuid REFERENCES public.users(id) ON DELETE
    SET NULL,
        session_id text,
        country text,
        created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON public.page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON public.page_views(user_id);
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
-- 2) Table book_views: tracking des vues de livres
CREATE TABLE IF NOT EXISTS public.book_views (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE
    SET NULL,
        session_id text,
        created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_book_views_book_id ON public.book_views(book_id);
CREATE INDEX IF NOT EXISTS idx_book_views_created_at ON public.book_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_book_views_book_created ON public.book_views(book_id, created_at DESC);
ALTER TABLE public.book_views ENABLE ROW LEVEL SECURITY;
-- 3) Table blog_views: tracking des vues d'articles de blog
CREATE TABLE IF NOT EXISTS public.blog_views (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug text NOT NULL,
    user_id uuid REFERENCES public.users(id) ON DELETE
    SET NULL,
        session_id text,
        created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blog_views_slug ON public.blog_views(slug);
CREATE INDEX IF NOT EXISTS idx_blog_views_created_at ON public.blog_views(created_at DESC);
ALTER TABLE public.blog_views ENABLE ROW LEVEL SECURITY;
-- 4) Table email_logs: journal des emails envoyes
CREATE TABLE IF NOT EXISTS public.email_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_type text NOT NULL,
    recipient_email text NOT NULL,
    subject text NOT NULL,
    status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
    resend_id text,
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON public.email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_email);
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
-- 5) Table blog_posts: articles de blog (remplacement du fichier TS hardcode)
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug text NOT NULL UNIQUE,
    title text NOT NULL,
    description text NOT NULL,
    body text NOT NULL,
    image_url text,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    author_id uuid REFERENCES public.users(id) ON DELETE
    SET NULL,
        published_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
-- Trigger for auto-updating updated_at (reutilise la fonction existante)
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER update_blog_posts_updated_at BEFORE
UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- 6) Ajouter un champ disabled_at aux users pour desactivation de compte
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS disabled_at timestamptz;