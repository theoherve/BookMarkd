-- Track how a book was added to the catalog (scan, search, or manual creation)
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS source TEXT;

ALTER TABLE public.books
  DROP CONSTRAINT IF EXISTS books_source_check;

ALTER TABLE public.books
  ADD CONSTRAINT books_source_check
  CHECK (source IS NULL OR source IN ('scan', 'search', 'manual'));

COMMENT ON COLUMN public.books.source IS 'How the book was added: scan (barcode), search (import from search), manual (create form). NULL for legacy rows.';
